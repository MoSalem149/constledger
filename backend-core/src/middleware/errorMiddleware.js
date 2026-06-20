// notFound — catch-all for unmatched routes; registered after all routers.
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// errorHandler — centralized Express error handler. Logs every error and
// returns a JSON body. Stack traces are only exposed outside production.
export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  console.error(`[error] ${err.message}`);
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
