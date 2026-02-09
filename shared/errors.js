// Shared error handling for microservices
class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

class ValidationError extends ApiError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  ApiError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  errorHandler,
};
