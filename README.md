
# NGINX ACL Architect

A simple web-based interface for managing NGINX access control lists.

## Overview

NGINX ACL Architect provides a user-friendly interface to manage IP and URL access control lists for NGINX forward proxy configurations. It allows you to:

- View and edit the NGINX configuration file
- Manage IP-based access control lists
- Manage URL-based access control lists
- Create combined ACL rules

## Deployment

The application is containerized and can be deployed using Docker Compose.

### Prerequisites

- Docker and Docker Compose installed
- Linux-based host system

### Installation

1. Clone this repository
2. Run the setup script:
   ```
   chmod +x setup.sh
   ./setup.sh
   ```
3. Start the containers:
   ```
   docker-compose up -d
   ```

## Architecture

The application consists of:

- NGINX forward proxy container
- NGINX web server container hosting the web interface
- Simple PHP-based API for configuration management

## Security Considerations

- The application assumes it's running in a protected environment
- All configuration changes are backed up before being applied
- Always test your configuration changes in a non-production environment first

## License

This project is open source and available under the MIT License.
