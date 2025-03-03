// postcss.config.cjs - using CommonJS format for better compatibility
module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss/nesting'),
    require('tailwindcss'),
    require('postcss-url'),
    require('autoprefixer'),
  ],
};
