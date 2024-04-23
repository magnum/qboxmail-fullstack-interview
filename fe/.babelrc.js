module.exports = (api) => {
  // This caches the Babel config by environment.
  api.cache.using(() => process.env.NODE_ENV);
  return {
    presets: ["@babel/preset-react", "@babel/preset-env"],
    plugins: [
      "lodash",
      "transform-react-remove-prop-types",
      "@babel/plugin-transform-runtime",
      [
        "@babel/plugin-proposal-decorators",
        {
          legacy: true,
        },
      ],
      "@babel/plugin-transform-async-to-generator",
      "@babel/plugin-proposal-optional-chaining",
      "@babel/plugin-proposal-class-properties",
      // Applies the react-refresh Babel plugin on non-production modes only
      !api.env("production") && "react-refresh/babel",
    ].filter(Boolean),
  };
};
