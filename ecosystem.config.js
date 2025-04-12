module.exports = {
  apps: [
    {
      name: "backend",
      script: "./backend/server.js", // Adjust path to your backend entry file
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      autorestart: true,
      watch: false,
    },
    {
      name: "frontend",
      cwd: "./frontend", // Path to your frontend directory
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      autorestart: true,
      watch: false,
    }
  ]
};
