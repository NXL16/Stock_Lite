module.exports = {
  apps: [
    {
      name: 'stocklite-api',
      script: './src/server.js',
      cwd: '/var/www/stocklite/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5002
      }
    }
  ]
};

