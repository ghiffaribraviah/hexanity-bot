module.exports = {
  apps: [
    {
      name: "hexanity-bot",
      script: "index.js",
      watch: false,
      autorestart: true,
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 3000,
      time: true,
      merge_logs: true,
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
