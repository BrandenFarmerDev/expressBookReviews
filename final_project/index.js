'use strict';

const express = require('express');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const authUserRoutes = require('./router/auth_users.js');
const { authenticated: customerRoutes, isSafeUsername, isValid } = authUserRoutes;
const { general: publicRoutes } = require('./router/general.js');
const { jwtSecret, sessionSecret } = require('./config.js');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use('/customer', session({
  name: 'bookshop.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 2 * 60 * 60 * 1000 },
}));

function requireAuthentication(req, res, next) {
  const authorization = req.get('authorization');
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return res.status(401).json({ error: 'Use an Authorization: Bearer <token> header.' });
    try {
      const payload = jwt.verify(match[1], jwtSecret);
      if (!payload || typeof payload.username !== 'string' || !isSafeUsername(payload.username) || !isValid(payload.username)) {
        throw new Error('Invalid token subject');
      }
      req.user = { username: payload.username };
      return next();
    } catch (_error) {
      return res.status(401).json({ error: 'The authentication token is invalid or expired.' });
    }
  }

  if (req.session && req.session.user && typeof req.session.user.username === 'string' &&
      isSafeUsername(req.session.user.username) && isValid(req.session.user.username)) {
    req.user = { username: req.session.user.username };
    return next();
  }
  return res.status(401).json({ error: 'Please log in before managing reviews.' });
}

app.use('/customer/auth', requireAuthentication);
app.use('/customer', customerRoutes);
app.use('/', publicRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  console.error(error);
  return res.status(500).json({ error: 'Internal server error.' });
});

function start(port = Number(process.env.PORT) || 5000) {
  return app.listen(port, () => console.log(`Book review API listening on port ${port}`));
}

if (require.main === module) start();

module.exports = { app, start, requireAuthentication, JWT_SECRET: jwtSecret };
