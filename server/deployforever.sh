

pm2 stop van_webrtc_signaling_server
pm2 start server.js --interpreter node --name van_webrtc_signaling_server --cwd /root/deployments/van_webrtc_signaling_server



