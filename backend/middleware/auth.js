const jwt = require("jsonwebtoken");
const httpError = require("../utils/httpError");

function auth(req, res, next) {
  const [scheme, token] = String(req.headers.authorization || "").split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(httpError(401, "Missing or malformed Authorization header"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id: payload.sub, company: payload.company, role: payload.role };
    next();
  } catch (err) {
    next(httpError(401, "Invalid or expired token"));
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return next(httpError(403, "Admin access required"));
  }

  next();
}

module.exports = { auth, requireAdmin };
