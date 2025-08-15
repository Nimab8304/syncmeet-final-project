// client/src/utils/error.js

/**
 * Normalizes API/network errors to a consistent shape:
 * { message: string, status?: number }
 */
export function normalizeError(err, fallbackMessage = "An unexpected error occurred") {
  if (!err) return { message: fallbackMessage };

  // If it's already our custom error shape
  if (err.message && typeof err.message === "string") {
    return { message: err.message, status: err.status };
  }

  // Axios-like error
  if (err.response) {
    const data = err.response.data || {};
    return {
      message: data.message || data.msg || fallbackMessage,
      status: err.response.status,
    };
  }

  // Fetch-like error with .status set
  if (err.status) {
    return {
      message: err.message || fallbackMessage,
      status: err.status,
    };
  }

  return { message: fallbackMessage };
}
