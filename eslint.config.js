import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "docs/**",
      "tests/__fixtures__/**",
      "coverage/**",
      ".turbo/**",
    ],
  },
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // Relax some rules for CLI tools
      "prefer-const": "warn",
      "no-var": "warn",
      "object-shorthand": "warn",
      "prefer-arrow-callback": "warn",

      // Import/export rules
      "no-duplicate-imports": "error",

      // Error handling rules
      "no-throw-literal": "warn",

      // Console usage (allow in CLI tools)
      "no-console": "off",

      // Allow common patterns in Node.js
      "no-undef": "off", // TypeScript handles this
    },
  },
);
