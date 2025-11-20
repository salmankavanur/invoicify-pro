module.exports = {
  apps: [
    {
      name: 'invoicify-pro',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5004',
      cwd: '/path/to/your/app', // Update this to your actual production path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '5004',
        VITE_PORT: '5004',
        VITE_HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: '5004',
        VITE_PORT: '5004',
        VITE_HOST: '0.0.0.0'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.outerr.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      // Pre/post hooks
      pre_setup: 'npm run build',
      post_setup: 'mkdir -p logs'
    }
  ]
};