
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b6950823-0d1f-42d6-a43a-5b20a2ef8696

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

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b6950823-0d1f-42d6-a43a-5b20a2ef8696) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b6950823-0d1f-42d6-a43a-5b20a2ef8696) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
