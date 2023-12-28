module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/src/*",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    "max-len": ["error", {"code": 120}], // Set a higher value, e.g., 120 characters per line
    "object-curly-spacing": ["error", "never"], // To disallow spaces after '{'
    "block-spacing": ["error", "never"], // For disallowing spaces within blocks
    "no-trailing-spaces": ["error", {"ignoreComments": true}], // To ignore trailing spaces in comments
  },
};
