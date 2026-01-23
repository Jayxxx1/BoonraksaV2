import config from '../config/config.js';

/**
 * Global Error Handler Middleware
 * Ensures that stack traces are not leaked in production.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.url}:`, {
    message: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode
  });

  res.status(statusCode).json({
    status: 'error',
    message: config.NODE_ENV === 'production' && statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async Handler Wrapper
 * Eliminates the need for try-catch blocks in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
