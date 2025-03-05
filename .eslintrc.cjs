module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',  // Disable the ban-types rule to suppress errors
    'no-constant-condition': 'off',  // Disable constant condition errors
    'react-hooks/exhaustive-deps': 'warn',  // Warning only for exhaustive-deps
    'react/no-unescaped-entities': 'off',   // Disable unescaped entities errors
    '@typescript-eslint/no-empty-function': 'off' // Disable empty function errors
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  overrides: [
    {
      // For test and configuration files that use CommonJS
      files: ["*.js", "test-*.js"],
      rules: {
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ],
};
