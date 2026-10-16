/** PM2 process file — run from backend/: pm2 start deploy/ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'wlidi-api',
      cwd: __dirname + '/..',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
