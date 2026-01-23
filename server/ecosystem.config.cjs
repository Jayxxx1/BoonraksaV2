module.exports = {
  apps: [
    {
      name: 'boonraksa-api',
      script: 'index.js',
      instances: 'max', // or a specific number of instances
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
