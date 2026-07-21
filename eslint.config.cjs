/**
 * ESLint flat config para o projeto (TypeScript + React Native)
 */
module.exports = [
  // Ignorar node_modules e builds
  { ignores: ["**/node_modules/**", "android/**", "ios/**", "build/**"] },

  // Regras para arquivos TS/TSX
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      react: require("eslint-plugin-react"),
      "react-native": require("eslint-plugin-react-native"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      import: require("eslint-plugin-import"),
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-native/no-inline-styles": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },

  // Regras para arquivos JS
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      ecmaFeatures: { jsx: true },
    },
    plugins: { react: require("eslint-plugin-react") },
    rules: { "react/react-in-jsx-scope": "off" },
  },
];
