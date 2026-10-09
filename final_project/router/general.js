'use strict';

const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, isSafeUsername, registerUser } = require('./auth_users.js');

const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    return res.status(400).json({ error: 'Both username and password are required.' });
  }
  const cleanUsername = username.trim();
  if (!isSafeUsername(cleanUsername)) return res.status(400).json({ error: 'That username is reserved and cannot be used.' });
  if (cleanUsername.length > 80 || password.length > 1024) {
    return res.status(400).json({ error: 'Username or password exceeds the allowed length.' });
  }
  if (isValid(cleanUsername)) return res.status(409).json({ error: 'Username already exists.' });
  registerUser(cleanUsername, password);
  return res.status(201).json({ message: 'User registered successfully.', username: cleanUsername });
});

public_users.get('/', (_req, res) => res.json(books));

public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  return res.json({ isbn: req.params.isbn, ...book });
});

public_users.get('/author/:author', (req, res) => {
  const term = req.params.author.trim().toLocaleLowerCase();
  const matches = Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.author.toLocaleLowerCase().includes(term)));
  return res.json(matches);
});

public_users.get('/title/:title', (req, res) => {
  const term = req.params.title.trim().toLocaleLowerCase();
  const matches = Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.title.toLocaleLowerCase().includes(term)));
  return res.json(matches);
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  return res.json(book.reviews);
});

// These client functions exercise the four public retrieval endpoints with Axios.
// Importing the router never starts requests; run `node router/general.js` with the API running.
const API_BASE_URL = (process.env.BOOKSHOP_BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
async function getAllBooks(baseUrl = API_BASE_URL) {
  return (await axios.get(`${baseUrl}/`)).data;
}
async function getBookByISBN(isbn, baseUrl = API_BASE_URL) {
  return (await axios.get(`${baseUrl}/isbn/${encodeURIComponent(isbn)}`)).data;
}
async function getBooksByAuthor(author, baseUrl = API_BASE_URL) {
  return (await axios.get(`${baseUrl}/author/${encodeURIComponent(author)}`)).data;
}
async function getBooksByTitle(title, baseUrl = API_BASE_URL) {
  return (await axios.get(`${baseUrl}/title/${encodeURIComponent(title)}`)).data;
}

async function runAxiosExamples() {
  const [all, byIsbn, byAuthor, byTitle] = await Promise.all([
    getAllBooks(),
    getBookByISBN('1'),
    getBooksByAuthor('Jane Austen'),
    getBooksByTitle('Pride and Prejudice'),
  ]);
  console.log(JSON.stringify({ allBooks: all, isbn: byIsbn, author: byAuthor, title: byTitle }, null, 2));
}

if (require.main === module) {
  runAxiosExamples().catch((error) => {
    console.error(error.response ? error.response.data : error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  general: public_users,
  getAllBooks,
  getBookByISBN,
  getBooksByAuthor,
  getBooksByTitle,
  runAxiosExamples,
};
