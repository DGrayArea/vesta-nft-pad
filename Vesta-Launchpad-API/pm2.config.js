module.exports = {
    apps: [
      {
        name: "launchpad", // Replace with your application name
        script: "dist/server.js", // Replace with the entry point of your application
        instances: 1, // Use "max" to scale based on available CPU cores
        exec_mode: "cluster", // Use clustering for load balancing
        autorestart: true, // Enable automatic restart on failure
        watch: false, // Set to true if you want to enable file watching
        max_memory_restart: "1G", // Restart if memory usage exceeds 1GB
        env: {
        //   NODE_ENV: "production", // Set your desired environment
        //   PORT: 3000, // Set the port your app listens on
        },
      },
    ],
  };