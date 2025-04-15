
#!/bin/bash

echo "=== Checking Web UI Access ==="
echo "Testing local connection to web UI at port 3000..."
curl -I http://localhost:3000 || echo "Cannot connect to web UI on localhost:3000"

echo -e "\nChecking container status:"
docker ps | grep nginx-acl-architect

echo -e "\nChecking container logs:"
docker logs nginx-acl-architect --tail 20

echo -e "\nChecking if the serve process is running:"
docker exec nginx-acl-architect ps aux | grep serve

echo -e "\nChecking listening ports in the container:"
docker exec nginx-acl-architect netstat -tulpn 2>/dev/null || docker exec nginx-acl-architect ss -tulpn || echo "Network tools not available in container"

echo -e "\nChecking host network:"
netstat -tulpn 2>/dev/null | grep -E ':(3000|8080)' || ss -tulpn | grep -E ':(3000|8080)' || echo "Network tools not available on host"

echo "=== Check complete ==="
