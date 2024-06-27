const fs = require("fs/promises");

async function fetchText(location) {
  const locationLower = location.toLowerCase();
  if (locationLower.startsWith("http://") || locationLower.startsWith("https://")) {
    const result = await fetch(location);
    const text = await result.text();
    return text;
  }

  const text = await fs.readFile(location, "utf-8");
  return text;
}

module.exports.fetchText = fetchText;
