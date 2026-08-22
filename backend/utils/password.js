const crypto = require("crypto");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generateTempPassword(length = 10) {
  const bytes = crypto.randomBytes(length);

  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

module.exports = { generateTempPassword };
