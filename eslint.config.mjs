import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: [".next/**", "out/**", "pages-out/**", "node_modules/**", "_next/**", "tg/**", "ru/**", "404/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
