'use strict';

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'local-development-jwt-secret-change-before-deploy',
  sessionSecret: process.env.SESSION_SECRET || 'local-development-session-secret-change-before-deploy',
};
