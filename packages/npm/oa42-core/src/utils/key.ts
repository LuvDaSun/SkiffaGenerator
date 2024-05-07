/**
 * Generates and returns a new unique key.
 *
 * This function increments an internal counter each time it is called,
 * ensuring that each call returns a unique key.
 *
 * @returns {number} The newly generated unique key.
 */
let lastKey = 0;
export function newKey() {
  lastKey++;
  return lastKey;
}
