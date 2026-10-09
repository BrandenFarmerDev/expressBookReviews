'use strict';

const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const books = require('./booksdb.js');
const { jwtSecret } = require('../config.js');

const regd_users = express.Router();
const users = [];
const HASH_BYTES = 32;
const RESERVED_USERNAMES = new Set([
  '__proto__', 'prototype', 'constructor', 'tostring', 'valueof', 'hasownproperty',
  'isprototypeof', 'propertyisenumerable', '__definegetter__', '__definesetter__',
  '__lookupgetter__', '__lookupsetter__',
]);

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, HASH_BYTES);
}

const isValid = (username) => users.some((user) => user.username === username);
const isSafeUsername = (username) => typeof username === 'string' && !RESERVED_USERNAMES.has(username.toLocaleLowerCase());

function registerUser(username, password) {
  if (!isSafeUsername(username) || isValid(username)) return false;
  const salt = crypto.randomBytes(16);
  users.push({ username, salt: salt.toString('base64url'), passwordHash: passwordHash(password, salt).toString('base64url') });
  return true;
}

const authenticatedUser = (username, password) => {
  if (!isSafeUsername(username) || typeof password !== 'string') return false;
  const user = users.find((candidate) => candidate.username === username);
  if (!user) return false;
  const expected = Buffer.from(user.passwordHash, 'base64url');
  const actual = passwordHash(password, Buffer.from(user.salt, 'base64url'));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// Login establishes both a signed bearer token and a server-side session.
regd_users.post('/login', async (req, res, next) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ error: 'Both username and password are required.' });
  }
  if (password.length > 1024) return res.status(400).json({ error: 'Password exceeds the allowed length.' });
  const cleanUsername = username.trim();
  if (!isSafeUsername(cleanUsername)) return res.status(401).json({ error: 'Invalid username or password.' });
  if (!authenticatedUser(cleanUsername, password)) return res.status(401).json({ error: 'Invalid username or password.' });

  try {
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.user = { username: cleanUsername };
    const token = jwt.sign({ username: cleanUsername }, jwtSecret, { subject: cleanUsername, expiresIn: '2h' });
    await new Promise((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
    return res.json({ message: 'User successfully logged in.', username: cleanUsername, token });
  } catch (error) {
    return next(error);
  }
});

function findBook(req, res) {
  const book = books[req.params.isbn];
  if (!book) {
    res.status(404).json({ error: 'Book not found.' });
    return null;
  }
  return book;
}

function readReview(req, res) {
  const review = req.query.review ?? (req.body || {}).review;
  if (typeof review !== 'string' || !review.trim()) {
    res.status(400).json({ error: 'A non-empty review string is required.' });
    return null;
  }
  if (review.length > 5000) {
    res.status(400).json({ error: 'Review must be 5,000 characters or fewer.' });
    return null;
  }
  return review.trim();
}

// Create a review once per user and book.
regd_users.post('/auth/review/:isbn', (req, res) => {
  const book = findBook(req, res);
  if (!book) return;
  const review = readReview(req, res);
  if (review === null) return;
  if (Object.hasOwn(book.reviews, req.user.username)) {
    return res.status(409).json({ error: 'You already reviewed this book. Use PUT or PATCH to change your review.' });
  }
  book.reviews[req.user.username] = review;
  return res.status(201).json({ message: 'Review added.', isbn: req.params.isbn, username: req.user.username, review });
});

// PUT is the starter rubric's Add Review route; it creates or replaces only this user's review.
regd_users.put('/auth/review/:isbn', (req, res) => {
  const book = findBook(req, res);
  if (!book) return;
  const review = readReview(req, res);
  if (review === null) return;
  const created = !Object.hasOwn(book.reviews, req.user.username);
  book.reviews[req.user.username] = review;
  return res.status(created ? 201 : 200).json({ message: created ? 'Review added.' : 'Review updated.', isbn: req.params.isbn, username: req.user.username, review });
});

// PATCH modifies an existing review belonging to the authenticated user only.
regd_users.patch('/auth/review/:isbn', (req, res) => {
  const book = findBook(req, res);
  if (!book) return;
  const review = readReview(req, res);
  if (review === null) return;
  if (!Object.hasOwn(book.reviews, req.user.username)) return res.status(404).json({ error: 'Your review was not found.' });
  book.reviews[req.user.username] = review;
  return res.json({ message: 'Review updated.', isbn: req.params.isbn, username: req.user.username, review });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const book = findBook(req, res);
  if (!book) return;
  if (!Object.hasOwn(book.reviews, req.user.username)) return res.status(404).json({ error: 'Your review was not found.' });
  delete book.reviews[req.user.username];
  return res.json({ message: 'Review deleted.', isbn: req.params.isbn, username: req.user.username });
});

module.exports = { authenticated: regd_users, isValid, isSafeUsername, authenticatedUser, registerUser, users };
