
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
    access_log /var/log/nginx/denied.log denied if=$deny_log;


#==============================================================================
    #IP WHITELIST
    # Use geo module to determine if incoming IP is on whitelist
    # use CIDR notation and the below format, also add the server name as a reference
    geo $whitelist {
        default 0;
        # Allow Individual IPs below:
		172.24.20.12/32 1;  #MOTPERWU01 wsus
		172.24.20.16/32 1;  #motperap04 rhel repo
     		172.28.33.2/32  1;  # TestWin10-01 defender test wonmunna
		172.28.36.4/32  1;  #TestSvr2022-01 defender test wonmunna
		172.28.36.5/32  1;  #TestLinux-01 defender test wonmunna
        
        # Allow Subnets below:
	172.24.20.0/23 1;
    }
    # ------------------------------------
    # URL WHITELIST
    # url filtering for external addresses - default-deny approach. See Confluence article for more info
       
    map $host $is_allowed_url {
        default 0;  # Block by default - deny unless explicitly allowed
    
        # Allow specific domains below:"   
        "~^.*\.microsoft\.com$"          1;	#motperwu01
	"~^.*\.windowsupdate\.com$"      1;	#motperwu01
        "subscription.rhn.redhat.com"    1;	#motperap04
       "subscription.rhsm.redhat.com"    1;	#motperap04
        "cdn.redhat.com"	 	 1;	#motperap04
 	"~^.*\.akamaiedge\.net$"	 1;	#motperap04
	"~^.*\.akamaitechnologies\.com$" 1;	#motperap04
	"~^.*\.windows\.net$"            1;	#defender EDR

    
    }
# END OF CODE TO EDIT, DO NOT EDIT BELOW.
# ==============================================================================

    # Variables for logging denied requests
    map $status $deny_log {
        ~^4 1;  # Log all 4xx responses (including 403 denied requests)
        default 0;
    }
    
    # Map to set denial reason
    map "$whitelist:$is_allowed_url" $deny_reason {
        "0:0" "IP not whitelisted and URL not allowed";
        "0:1" "IP not whitelisted";
        "1:0" "URL not in allowed list";
        default "";
    }

    server {
        listen 8080;
		# External DNS server/s
        resolver 8.8.8.8 1.1.1.1 ipv6=off;

        # Use the geo variable for access control
        if ($whitelist = 0) {
            set $deny_reason "IP not whitelisted: $remote_addr";
	    return 403 "Access denied: Your IP is not whitelisted.";
        }

        # Block disallowed URLs
        if ($is_allowed_url = 0) {
            set $deny_reason "URL not in allowed list: $host";
	    return 403 "Access denied: This URL is not in the allowed list.";
        }

        # HTTPS CONNECT method handling
        proxy_connect;
        proxy_connect_allow all;  # Allow all ports for HTTPS connections
        proxy_connect_connect_timeout 10s;
        proxy_connect_read_timeout 60s;
        proxy_connect_send_timeout 60s;

        # Security headers
        proxy_hide_header Upgrade;
        proxy_hide_header X-Powered-By;
        add_header Content-Security-Policy "upgrade-insecure-requests";
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Cache-Control "no-transform" always;
        add_header Referrer-Policy no-referrer always;
        add_header X-Robots-Tag none;

        # HTTP forwarding
        location / {
            # Check whitelist again at location level
            if ($whitelist = 0) {
                set $deny_reason "IP not whitelisted at location level: $remote_addr";
				return 403 "Access denied: Your IP is not whitelisted.";
            }

            # Check URL filtering again at location level
            if ($is_allowed_url = 0) {
                set $deny_reason "URL not in allowed list at location level: $host";
				return 403 "Access denied: This URL is not in the allowed list.";
            }

            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Connection "";  # Enable keepalives
            proxy_pass $scheme://$host$request_uri;  # Include $request_uri

            # Additional useful headers
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts for better reliability
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
			
      } #End of Location Block
  } #End of Server Block
} #End of HTTP Block
EOF
  echo "Created initial nginx.conf in /opt/proxy"
fi

# Create a symlink to ensure Nginx can find the config file
ln -sf /opt/proxy/nginx.conf /usr/local/nginx/conf/nginx.conf 2>/dev/null || true

# Make the script executable
chmod +x setup.sh

echo "Setup completed at /opt/proxy. You can now run: docker-compose up -d"
