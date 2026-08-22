function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const keys = Object.keys(err.keyPattern || {});
    const meaningful = keys.filter((key) => key !== "company");
    const field = (meaningful.length ? meaningful : keys).join(" + ") || "value";

    return res.status(409).json({ message: `${field} is already in use` });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: details.join(", ") });
  }

  const status = err.status || 500;

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({ message: status === 500 ? "Something went wrong" : err.message });
}

module.exports = errorHandler;
