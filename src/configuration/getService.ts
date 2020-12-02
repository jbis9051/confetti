import path from 'path';

export default function getService() {
    return `[Unit]
Description=confetti-cd

[Service]
ExecStart=${path.join(__dirname, '..', 'app.js')}
Restart=always
User=nobody
# Note Debian/Ubuntu uses 'nogroup', RHEL/Fedora uses 'nobody'
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=${path.join(__dirname, '..', '..')}

[Install]
WantedBy=multi-user.target`;
}
