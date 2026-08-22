// Mirrors companyCodeFrom() in backend/utils/loginId.js so the code shown on the
// form is the same one the server would derive.
function lettersOnly(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
}

export default function companyCodeFrom(companyName) {
  const words = String(companyName || "").trim().split(/\s+/).filter(Boolean);
  const initials = words.map((word) => lettersOnly(word).charAt(0)).join("");
  const source = initials.length >= 2 ? initials : lettersOnly(companyName);

  return source.slice(0, 2).padEnd(2, "X");
}
