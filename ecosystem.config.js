module.exports = {
    apps: [
        {
            name: 'qualificaai-backend',
            script: 'src/app.js',
            cwd: '/var/www/qualificaai/backend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: '/var/log/pm2/qualificaai-error.log',
            out_file: '/var/log/pm2/qualificaai-out.log',
        },
    ],
};
