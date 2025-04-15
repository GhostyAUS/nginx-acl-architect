
#!/bin/bash

echo "Checking nginx configuration..."
echo "Configuration file location:"
ls -la /opt/proxy/nginx.conf || echo "File not found at /opt/proxy/nginx.conf"

echo "Configuration file contents:"
cat /opt/proxy/nginx.conf || echo "Cannot read file"

echo "Checking if file is accessible in container:"
docker exec -it nginx-forward-proxy ls -la /usr/local/nginx/conf/nginx.conf || echo "File not found in container"

echo "Checking configuration (detailed output):"
docker exec -it nginx-forward-proxy nginx -T || echo "Configuration dump failed"
echo "Testing configuration:"
docker exec -it nginx-forward-proxy nginx -t || echo "Configuration test failed"

echo "Checking container logs:"
docker logs nginx-forward-proxy --tail 20

echo "Check complete."
