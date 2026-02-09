// Shared HTTP client for service-to-service communication
const axios = require('axios');

const serviceClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry logic for service calls
const withRetry = async (fn, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 100)
        );
      }
    }
  }
  throw lastError;
};

module.exports = { serviceClient, withRetry };
