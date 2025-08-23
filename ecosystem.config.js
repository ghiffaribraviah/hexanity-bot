module.exports = {
  apps: [
    {
      name: "hexanity-bot",
      script: "index.js",
      watch: false,
      env: { NODE_ENV: "production" }
    }
  ]
};
