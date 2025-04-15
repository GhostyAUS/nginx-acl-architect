
#!/bin/bash

# Create base directory
mkdir -p /opt/proxy
cd /opt/proxy

# Create necessary directories
mkdir -p logs
mkdir -p conf.d
mkdir -p ssl

# Set proper permissions
chmod 755 logs conf.d ssl

# Create initial nginx.conf if it doesn't exist
if [ ! -f nginx.conf ]; then
  cat > nginx.conf <<EOF
# NGINX Configuration
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    # START OF CODE TO EDIT
    # ACL configurations will be added here by the architect tool
    # END OF CODE TO EDIT

    server {
        listen       8080;
        server_name  localhost;

        location / {
            resolver 8.8.8.8;
            proxy_pass \$scheme://\$host\$request_uri;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
  echo "Created initial nginx.conf in /opt/proxy"
fi

# Make the script executable
chmod +x setup.sh

echo "Setup completed at /opt/proxy. You can now run: docker-compose up -d"
