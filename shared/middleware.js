// Shared middleware for microservices
const helmet = require('helmet');
const cors = require('cors');
const express = require('express');

const logger = require('./logger');

// Security middleware
const securityMiddleware = [helmet(), cors()];

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
};

// Request parsing middleware
const parseMiddleware = [
  express.json(),
  express.urlencoded({ extended: true }),
];

module.exports = {
  securityMiddleware,
  requestLogger,
  parseMiddleware,
};
