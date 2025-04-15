
#!/bin/bash

# Path to the nginx config file
NGINX_CONF="/opt/proxy/nginx.conf"

echo "Checking nginx configuration at $NGINX_CONF..."

if [ ! -f "$NGINX_CONF" ]; then
    echo "Error: nginx configuration file not found at $NGINX_CONF"
    exit 1
fi

# Create a backup of the original file
cp "$NGINX_CONF" "${NGINX_CONF}.bak"
echo "Created backup at ${NGINX_CONF}.bak"

# Fix the if statements with "=" that nginx doesn't like
# Replace "if=$var = 0" with "if=$var != 1"
sed -i 's/if=\$\([a-zA-Z_][a-zA-Z0-9_]*\)\s*=\s*0/if=$\1 != 1/g' "$NGINX_CONF"
# Also fix the if statements inside the config
sed -i 's/if\s*(\$\([a-zA-Z_][a-zA-Z0-9_]*\)\s*=\s*0)/if ($\1 != 1)/g' "$NGINX_CONF"

echo "Fixed potential syntax errors in nginx configuration"

# Test the fixed configuration
echo "Testing the fixed configuration..."
docker exec -it nginx-forward-proxy nginx -t

if [ $? -eq 0 ]; then
    echo "Success! Configuration syntax is valid."
    echo "Reloading nginx..."
    docker exec -it nginx-forward-proxy nginx -s reload
    echo "Nginx reloaded successfully."
else
    echo "Warning: Configuration still has errors. Reverting to backup..."
    cp "${NGINX_CONF}.bak" "$NGINX_CONF"
    echo "Reverted to backup. Please check the configuration manually."
fi

echo "Done."
