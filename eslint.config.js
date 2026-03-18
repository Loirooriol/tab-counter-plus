import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";

export default defineConfig([
  {
    plugins: {
      js,
    },
    "extends": ["js/all"],
    "rules": {
      "array-bracket-newline": ["error", "consistent"],
      "array-element-newline": ["error", "consistent"],
      "capitalized-comments": "off",
      "comma-dangle": ["error", {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "never"
      }],
      "consistent-return": "off",
      "eqeqeq": ["error", "smart"],
      "func-names": ["error", "as-needed"],
      "func-style": ["error", "declaration", {"allowArrowFunctions": true}],
      "function-call-argument-newline": ["error", "consistent"],
      "function-paren-newline": "off",
      "id-length": "off",
      "indent": ["error", 2, {"SwitchCase": 1}],
      "init-declarations": "off",
      "keyword-spacing": ["error", {"overrides": {"catch": {"after": false}}}],
      "line-comment-position": "off",
      "lines-between-class-members": ["error", "always", {"exceptAfterSingleLine": true}],
      "max-len": ["error", {"code": 90}],
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-statements": "off",
      "multiline-comment-style": ["error", "separate-lines"],
      "multiline-ternary": ["error", "always-multiline"],
      "newline-per-chained-call": "off",
      "no-eq-null": "off",
      "no-implicit-coercion": ["error", {"allow": ["!!", "+"]}],
      "no-implicit-globals": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-negated-condition": "off",
      "no-param-reassign": "off",
      "no-ternary": "off",
      "no-undefined": "off",
      "no-underscore-dangle": "off",
      "no-unused-vars": ["error", {"caughtErrors": "none"}],
      "no-useless-return": "off",
      "object-property-newline": ["error", {"allowAllPropertiesOnSameLine": true}],
      "one-var": ["error", {"initialized": "never"}],
      "padded-blocks": ["error", "never"],
      "prefer-destructuring": ["error", {"object": true, "array": false}],
      "prefer-template": "off",
      "quote-props": ["error", "as-needed"],
      "quotes": ["error", "double", {"avoidEscape": true}],
      "sort-keys": "off",
      "space-before-function-paren": ["error", {"anonymous": "never", "named": "never"}],
      "spaced-comment": ["error", "always", {"block": {"balanced": true}}],
      "strict": "off",
      "wrap-iife": ["error", "inside"]
    }
  }, {
    "basePath": "src",
    "languageOptions": {
      "ecmaVersion": 9,
      "globals": {
        ...globals.webextensions,
        ...globals.browser,
      }
    },
  }, {
    "basePath": "tests",
    "languageOptions": {
      "ecmaVersion": 13,
      "globals": {
        ...globals.node,
        ...globals.jest,
      }
    },
    "rules": {
      "default-case": "off",
      "no-await-in-loop": "off",
      "require-await": "off"
    }
  }
]);
