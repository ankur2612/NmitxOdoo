const Counter = require("../models/Counter");

function lettersOnly(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

function companyCodeFrom(companyName) {
  const words = String(companyName || "").trim().split(/\s+/).filter(Boolean);
  const initials = words.map((word) => lettersOnly(word).charAt(0)).join("");
  const source = initials.length >= 2 ? initials : lettersOnly(companyName);

  return source.slice(0, 2).padEnd(2, "X");
}

function nameSegment(firstName, lastName) {
  const first = lettersOnly(firstName).slice(0, 2).padEnd(2, "X");
  const last = lettersOnly(lastName).slice(0, 2).padEnd(2, "X");

  return `${first}${last}`;
}

async function generateLoginId({ companyId, companyCode, firstName, lastName, joiningDate }) {
  const year = joiningDate.getFullYear();
  const seq = await Counter.next(`${companyId}:${year}`);
  const serial = String(seq).padStart(4, "0");

  return `${companyCode}${nameSegment(firstName, lastName)}${year}${serial}`;
}

module.exports = { generateLoginId, companyCodeFrom, nameSegment };
