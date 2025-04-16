
#!/bin/bash

echo "Checking web UI access..."

# Check if the containers are running
echo "Checking container status:"
docker ps | grep -E "nginx-(proxy|acl-architect)"

# Check if port 3000 is listening
echo -e "\nChecking if port 3000 is open:"
netstat -tuln | grep 3000 || echo "Port 3000 is not open"

# Try a simple curl request
echo -e "\nTrying to access the web UI:"
curl -I http://localhost:3000 2>&1 || echo "Failed to connect to the web UI"

# Check logs
echo -e "\nChecking service logs for build issues:"
docker logs nginx-acl-architect | tail -30

echo -e "\nTry rebuilding the containers with:"
echo "docker-compose down && docker-compose up -d"
