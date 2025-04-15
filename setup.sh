
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
  cat > nginx.conf <<'EOF'
worker_processes auto;
daemon off;
events {
    worker_connections 1024;
}

http {
    # Log formats remain unchanged
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    log_format denied '$remote_addr - [$time_local] "$request" '
                      '$status "$http_user_agent" "$http_referer" '
                      'Host: "$host" URI: "$request_uri" '
                      'Client: "$remote_addr" '
                      'Reason: "$deny_reason"';
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log info;
    
    # Define deny_log variable before using it
    map $access_granted $deny_log {
        0 1;  # Log if access is denied
        1 0;  # Don't log if access is granted
    }
    
    access_log /var/log/nginx/denied.log denied if=$deny_log;

#==============================================================================
    # Structured ACL Definitions
    # IP-based ACL Groups
    geo $acl_internal_ips {
        default 0;
        # Production network
        172.24.20.0/23 1;  # Main production subnet
        
        # Individual production hosts
        172.24.20.12/32 1;  # MOTPERWU01 wsus
        172.24.20.16/32 1;  # motperap04 rhel repo
    }

    geo $acl_test_ips {
        default 0;
        # Test environment IPs
        172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
        172.28.36.4/32  1;  # TestSvr2022-01 defender test wonmunna
        172.28.36.5/32  1;  # TestLinux-01 defender test wonmunna
    }

    # URL-based ACL Groups
    map $host $acl_microsoft_urls {
        default 0;
        "~^.*\.microsoft\.com$"          1;  # Microsoft domains
        "~^.*\.windowsupdate\.com$"      1;
        "~^.*\.windows\.net$"            1;  # Defender EDR
    }

    map $host $acl_redhat_urls {
        default 0;
        "subscription.rhn.redhat.com"    1;
        "subscription.rhsm.redhat.com"   1;
        "cdn.redhat.com"                 1;
    }

    map $host $acl_cdn_urls {
        default 0;
        "~^.*\.akamaiedge\.net$"         1;
        "~^.*\.akamaitechnologies\.com$" 1;
    }

    # Combined ACL Logic
    map "$acl_internal_ips$acl_test_ips" $ip_acl {
        default 0;
        "~*1" 1;  # Allow if either internal or test IPs match
    }

    map "$acl_microsoft_urls$acl_redhat_urls$acl_cdn_urls" $url_acl {
        default 0;
        "~*1" 1;  # Allow if any URL group matches
    }

    # Final Access Decision
    map "$ip_acl$url_acl" $access_granted {
        default 0;
        "11" 1;  # Both IP and URL must be allowed
    }

    # Denial Reasons Mapping
    map "$ip_acl$url_acl" $deny_reason {
        "00" "Both IP and URL not allowed";
        "01" "IP not whitelisted";
        "10" "URL not allowed";
        default "";
    }

# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================
    server {
        listen 8080;
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Centralized ACL Check
        if ($access_granted = 0) {
            return 403 "Access Denied: $deny_reason";
        }

        # Security headers and proxy settings remain unchanged
        proxy_connect;
        proxy_connect_allow all;
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        location / {
            # Single ACL check instead of duplicate validations
            if ($access_granted = 0) {
                set $deny_reason "$deny_reason (location level)";
                return 403 "Access Denied: $deny_reason";
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";
            proxy_pass $scheme://$host$request_uri;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
}
EOF
  echo "Created initial nginx.conf in /opt/proxy"
fi

# Create a symlink to ensure Nginx can find the config file
ln -sf /opt/proxy/nginx.conf /usr/local/nginx/conf/nginx.conf 2>/dev/null || true

# Make the script executable
chmod +x setup.sh

echo "Setup completed at /opt/proxy. You can now run: docker-compose up -d"
