module.exports = {
  env: { node: true, es2021: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: 12 },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
  },
};
