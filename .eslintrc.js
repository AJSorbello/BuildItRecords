module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint',
    'react-hooks'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'react/no-unescaped-entities': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/ban-types': 'warn'
  },
  ignorePatterns: [
    'node_modules/**',
    'build/**',
    'dist/**',
    '.vercel/**',
    'cleanup-backup/**',
    '*.test.{js,ts,tsx}',
    'coverage/**'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  }
};