// notFound — catch-all for unmatched routes; registered after all routers.
export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// errorHandler — centralized Express error handler. Logs every error and
// returns a JSON body with the correct HTTP status. Known Mongoose error
// types are mapped to their appropriate 4xx codes so the frontend can
// surface meaningful messages to the user. Stack traces are only exposed
// outside production.
export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode
    ?? (err.name === 'ValidationError' || err.name === 'CastError' ? 400
      : err.code === 11000 ? 409
      : 500);
  console.error(`[error] ${err.message}`);
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};