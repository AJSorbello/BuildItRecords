module.exports = {
  root: true,
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "no-unused-vars": "off"
  }
};