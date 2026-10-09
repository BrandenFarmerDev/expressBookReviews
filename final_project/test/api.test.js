'use strict';

const { after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const books = require('../router/booksdb.js');
const { app } = require('../index.js');
const { jwtSecret } = require('../config.js');
const { users } = require('../router/auth_users.js');
const { getAllBooks, getBookByISBN, getBooksByAuthor, getBooksByTitle } = require('../router/general.js');

const api = supertest(app);
let server;
let baseUrl;

beforeEach(() => {
  users.splice(0, users.length);
  for (const book of Object.values(books)) book.reviews = {};
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function registerAndLogin(username, password = 'test-password-123') {
  const registration = await api.post('/register').send({ username, password });
  assert.equal(registration.status, 201);
  const login = await api.post('/customer/login').send({ username, password });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  return login.body.token;
}

test('public book endpoints list and search the preserved starter catalog', async () => {
  const all = await api.get('/');
  assert.equal(all.status, 200);
  assert.equal(Object.keys(all.body).length, 10);
  assert.equal((await api.get('/isbn/1')).body.title, 'Things Fall Apart');
  assert.equal((await api.get('/author/jane%20austen')).body['8'].title, 'Pride and Prejudice');
  assert.equal((await api.get('/title/pride%20and%20prejudice')).body['8'].author, 'Jane Austen');
  assert.equal((await api.get('/isbn/missing')).status, 404);
  assert.deepEqual((await api.get('/review/1')).body, {});
});

test('registration validates input, prevents duplicate usernames, and authenticates only valid passwords', async () => {
  assert.equal((await api.post('/register').send({ username: '', password: '' })).status, 400);
  assert.equal((await api.post('/register').send({ username: 'reader', password: 'correct horse' })).status, 201);
  assert.equal((await api.post('/register').send({ username: 'reader', password: 'another' })).status, 409);
  assert.equal((await api.post('/customer/login').send({ username: 'reader', password: 'wrong' })).status, 401);
  assert.equal((await api.post('/customer/login').send({ username: 'reader', password: 'correct horse' })).status, 200);
});

test('JWT users can add, modify, and delete only their own book reviews', async () => {
  assert.equal((await api.post('/customer/auth/review/1').send({ review: 'No login' })).status, 401);
  const aliceToken = await registerAndLogin('alice');
  const alice = { Authorization: `Bearer ${aliceToken}` };
  const added = await api.put('/customer/auth/review/1?review=Thoughtful%20and%20moving.').set(alice);
  assert.equal(added.status, 201);
  assert.equal((await api.get('/review/1')).body.alice, 'Thoughtful and moving.');
  const changed = await api.patch('/customer/auth/review/1').set(alice).send({ review: 'A lasting classic.' });
  assert.equal(changed.status, 200);
  assert.equal((await api.get('/review/1')).body.alice, 'A lasting classic.');

  const bobToken = await registerAndLogin('bob');
  const bob = { Authorization: `Bearer ${bobToken}` };
  assert.equal((await api.patch('/customer/auth/review/1').set(bob).send({ review: 'Overwrite' })).status, 404);
  assert.equal((await api.delete('/customer/auth/review/1').set(bob)).status, 404);
  assert.equal((await api.put('/customer/auth/review/1').set(bob).send({ review: 'A second perspective.' })).status, 201);
  const reviews = (await api.get('/review/1')).body;
  assert.deepEqual(reviews, { alice: 'A lasting classic.', bob: 'A second perspective.' });
  assert.equal((await api.delete('/customer/auth/review/1').set(alice)).status, 200);
  assert.deepEqual((await api.get('/review/1')).body, { bob: 'A second perspective.' });
});

test('review PUT accepts the rubric query parameter and rejects unsafe usernames', async () => {
  const reservedRegistration = await api.post('/register').send({ username: '__proto__', password: 'test-password-123' });
  assert.equal(reservedRegistration.status, 400);
  const reservedLogin = await api.post('/customer/login').send({ username: '__proto__', password: 'test-password-123' });
  assert.equal(reservedLogin.status, 401);
  const forgedReservedToken = jwt.sign({ username: '__proto__' }, jwtSecret, { subject: '__proto__' });
  assert.equal((await api.put('/customer/auth/review/4?review=must%20not%20store').set({ Authorization: `Bearer ${forgedReservedToken}` })).status, 401);
  assert.deepEqual((await api.get('/review/4')).body, {});

  const token = await registerAndLogin('query-reader');
  const response = await api.put('/customer/auth/review/3?review=Query%20parameter%20review').set({ Authorization: `Bearer ${token}` });
  assert.equal(response.status, 201);
  assert.equal((await api.get('/review/3')).body['query-reader'], 'Query parameter review');
});

test('session login is an alternate authenticated path for review management', async () => {
  await api.post('/register').send({ username: 'session-reader', password: 'session-password' }).expect(201);
  const agent = supertest.agent(app);
  await agent.post('/customer/login').send({ username: 'session-reader', password: 'session-password' }).expect(200);
  const response = await agent.post('/customer/auth/review/2').send({ review: 'Fairy tales endure.' });
  assert.equal(response.status, 201);
  assert.equal((await api.get('/review/2')).body['session-reader'], 'Fairy tales endure.');
});

test('all four Axios retrieval helpers call the live Express endpoints', async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  assert.equal(Object.keys(await getAllBooks(baseUrl)).length, 10);
  assert.equal((await getBookByISBN('1', baseUrl)).title, 'Things Fall Apart');
  assert.equal((await getBooksByAuthor('Jane Austen', baseUrl))['8'].title, 'Pride and Prejudice');
  assert.equal((await getBooksByTitle('Pride and Prejudice', baseUrl))['8'].author, 'Jane Austen');
});
