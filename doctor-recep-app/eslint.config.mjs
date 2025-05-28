import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Add a new configuration object specifically for TypeScript files
  // to configure the no-unused-vars rule
  {
    files: ["**/*.ts", "**/*.tsx"], // Target TypeScript files
    rules: {
      // Disable the base ESLint no-unused-vars rule for TypeScript files
      // as @typescript-eslint/no-unused-vars will handle it.
      "no-unused-vars": "off",

      // Configure the @typescript-eslint/no-unused-vars rule
      "@typescript-eslint/no-unused-vars": [
        "warn", // Treat as a warning during build (you can change to "error" if you want)
        {
          "argsIgnorePattern": "^_", // Ignore unused arguments starting with underscore
          "varsIgnorePattern": "^_",  // Ignore unused variables starting with underscore (this targets your `_ in never` case)
          "caughtErrorsIgnorePattern": "^_" // Ignore unused variables in catch blocks starting with underscore
        }
      ]
    }
  }
];

export default eslintConfig;