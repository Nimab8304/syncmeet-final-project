// server/middleware/errorMiddleware.js
module.exports = (err, req, res, next) => {
  // Log the error (you can enhance with a logger later)
  if (process.env.NODE_ENV !== 'test') {
    console.error(err && err.stack ? err.stack : err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Server Error";

  // Optionally include extra details in development only
  const payload = {
    message,
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
