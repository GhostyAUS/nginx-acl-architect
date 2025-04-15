
#!/bin/bash

echo "Checking web UI access..."

# Check if the containers are running
echo "Checking container status:"
docker ps | grep -E "nginx-(proxy|acl-architect)"

# Get container IPs
echo -e "\nContainer network information:"
docker inspect nginx-acl-architect | grep -i ipaddress

# Check if port 3000 is listening
echo -e "\nChecking if port 3000 is open:"
netstat -tuln | grep 3000 || echo "Port 3000 is not open"

# Check if the service is responding
echo -e "\nTrying to access the web UI:"
curl -v http://localhost:3000 2>&1 | grep -E "< HTTP|Failed to connect"

echo -e "\nChecking service logs:"
docker logs nginx-acl-architect --tail 20

echo -e "\nDiagnostic complete. Try accessing http://localhost:3000 in your browser."
echo "If still not accessible, try restarting the containers with:"
echo "docker-compose down && docker-compose up -d"
