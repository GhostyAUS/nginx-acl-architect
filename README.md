
# NGINX ACL Architect

A lightweight tool for managing NGINX Access Control Lists.

## Overview

NGINX ACL Architect provides a user-friendly interface for managing IP-based and URL-based access control lists in NGINX configurations. This tool is designed to simplify the process of maintaining whitelists and blacklists for proxy servers.

## Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed on the host machine
- Git to clone the repository

### Deployment Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd nginx-acl-architect
```

2. **Run the setup script**
```bash
chmod +x setup.sh
./setup.sh
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Access the application**
- NGINX ACL Architect UI: http://localhost:3000
- NGINX Proxy: http://localhost:8080

### Updating the Application

To update the application with the latest changes:

```bash
# Pull latest changes
git pull

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build
```

### Monitoring and Logs

- View application logs: `docker-compose logs nginx-acl-architect`
- View proxy logs: `docker-compose logs nginx-proxy`
- Check the `./logs/` directory for detailed NGINX logs

## Technical Details

This application is built using:
- Vanilla JavaScript for the frontend
- Express.js for the backend API
- Docker for containerization

No React or path-to-regexp dependencies are used to ensure maximum compatibility and minimal dependencies.
