import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Base configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  ...compat.extends("eslint:recommended"),
  ...compat.extends("@typescript-eslint/recommended"),
  ...compat.extends("plugin:react/recommended"),
  ...compat.extends("plugin:react-hooks/recommended"),
  ...compat.extends("plugin:jsx-a11y/recommended"),
  ...compat.extends("plugin:import/recommended"),
  ...compat.extends("plugin:import/typescript"),
  ...compat.extends("prettier"), // Must be last to override other configs

  // Global configuration
  {
    languageOptions: {
      parser: compat.env({
        ESLINT_USE_FLAT_CONFIG: false,
      }),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-const": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-inferrable-types": "off",

      // React specific rules
      "react/react-in-jsx-scope": "off", // Next.js doesn't need React import
      "react/prop-types": "off", // We use TypeScript
      "react/no-unescaped-entities": "off",
      "react/display-name": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Import/Export rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import/no-unused-modules": "warn",
      "import/no-cycle": "error",
      "import/no-self-import": "error",

      // Security rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-alert": "error",

      // Best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "no-unused-labels": "error",
      "no-useless-catch": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "no-var": "error",

      // Accessibility rules
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-has-content": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",

      // Prettier integration
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
    },
  },

  // Test files configuration
  {
    files: ["**/*.test.{js,jsx,ts,tsx}", "**/*.spec.{js,jsx,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // Configuration files
  {
    files: [
      "*.config.{js,mjs,ts}",
      "jest.setup.js",
      "jest.env.js",
      "tailwind.config.js",
    ],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "import/no-anonymous-default-export": "off",
    },
  },

  // API routes
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-console": ["error", { allow: ["error", "warn", "info"] }],
    },
  },
];

export default eslintConfig;
