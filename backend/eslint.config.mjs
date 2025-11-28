export default tseslint.config({
    rules: {
      // Note: you must disable the base rule as it can report incorrect errors
      "no-array-constructor": "off",
      "@typescript-eslint/no-array-constructor": "error"
    }
  });