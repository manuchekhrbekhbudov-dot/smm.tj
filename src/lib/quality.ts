/**
 * Rejects keyboard-mash like "fuvgbefjbvjufbwvh" in public profile texts. Real Tajik / Russian /
 * English words have vowels and no very long consonant runs. URLs, @handles and numbers are ignored.
 */
const VOWELS = /[aeiouyаеёиоуыэюяӣӯ]/i;
const LETTER = /\p{L}/u;

export function looksLikeGibberish(text: string): boolean {
  const words = text.toLowerCase().replace(/https?:\/\/\S+|@\S+|\d+/g, " ").split(/[^\p{L}]+/u).filter(Boolean);
  const letters = words.join("");
  if (letters.length < 6) return false;
  const vowelShare = [...letters].filter((c) => VOWELS.test(c)).length / [...letters].filter((c) => LETTER.test(c)).length;
  const longest = Math.max(...words.map((w) => w.length));
  const maxRun = Math.max(...words.map((w) => Math.max(0, ...(w.split(VOWELS).map((r) => r.length)))));
  return longest > 22 || vowelShare < 0.22 || maxRun >= 6 || (letters.length >= 12 && words.length === 1 && maxRun >= 5);
}
