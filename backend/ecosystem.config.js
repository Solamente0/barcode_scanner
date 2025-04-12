// First, install PM2 globally
// npm install -g pm2

// Create a file called ecosystem.config.js
module.exports = {
  apps: [{
    name: "barcode_scanner",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
    },
    instances: 1,
    autorestart: true,
    watch: false,
  }]
};
