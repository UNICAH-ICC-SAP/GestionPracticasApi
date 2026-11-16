import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { ignores: ['node_modules/**', 'dist/**', 'coverage/**'] },
  { languageOptions: { globals: globals.node } },
  { files: ['tests/**/*.js'], languageOptions: { globals: globals.jest } },
  pluginJs.configs.recommended,
];
