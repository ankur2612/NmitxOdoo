const dns = require("dns");
const mongoose = require("mongoose");

const PUBLIC_DNS = ["8.8.8.8", "1.1.1.1"];

function ensureResolvableDns() {
  const usable = dns.getServers().filter((server) => {
    return !server.startsWith("127.") && server !== "::1";
  });

  if (usable.length === 0) {
    dns.setServers(PUBLIC_DNS);
  }
}

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is missing from .env");
  }

  ensureResolvableDns();

  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
