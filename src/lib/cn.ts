import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the custom font-size tokens so `text-h1` isn't treated as a colour.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { "font-size": [{ text: ["hero", "display", "h1", "h2", "h3"] }] } },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
