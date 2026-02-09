// Shared logger for microservices
const logger = {
  info: (message, data) => {
    console.log(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message,
        ...data,
      })
    );
  },
  warn: (message, data) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        ...data,
      })
    );
  },
  error: (message, error, data) => {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error?.message,
        stack: error?.stack,
        ...data,
      })
    );
  },
};

module.exports = logger;
