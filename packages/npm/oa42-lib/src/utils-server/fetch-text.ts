import fs from "fs/promises";

export async function fetchText(location: string) {
  const locationLower = location.toLowerCase();
  if (locationLower.startsWith("http://") || locationLower.startsWith("https://")) {
    const result = await fetch(location);
    const text = await result.text();
    return text;
  }

  const text = await fs.readFile(location, "utf-8");
  return text;
}
