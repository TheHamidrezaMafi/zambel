# Zambeel Docker Setup

This project uses Docker Compose to manage three services: Frontend (Next.js), Backend (NestJS), and Scraper (Python).

## 📋 Prerequisites

- Docker
- Docker Compose (v2 or v1)

## 🚀 Quick Start

### Option 1: Using the Management Script (Recommended)

```bash
# Make the script executable
chmod +x docker.sh

# Build and start all services
./docker.sh up

# View status
./docker.sh status

# View logs
./docker.sh logs-f

# Stop all services
./docker.sh down
```

### Option 2: Using Docker Compose Directly

```bash
# Build and start all services
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

## 🔧 Available Commands (docker.sh)

| Command | Description |
|---------|-------------|
| `up` | Build and start all services |
| `down` | Stop and remove all containers |
| `restart` | Restart all services |
| `build` | Rebuild all Docker images |
| `logs` | Show logs from all services |
| `logs-f` | Follow logs from all services (live) |
| `status` | Show status of all containers |
| `clean` | Stop containers and remove images |
| `logs-scraper` | Show scraper service logs only |
| `logs-backend` | Show backend service logs only |
| `logs-frontend` | Show frontend service logs only |

## 🌐 Service URLs

After starting the services, access them at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Backend Swagger**: http://localhost:8080/api
- **Scraper**: http://localhost:5000

## 📦 Services Architecture

```
┌─────────────────┐
│    Frontend     │  (Next.js - Port 3000)
│   (Next.js)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Backend     │  (NestJS - Port 8080)
│    (NestJS)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│    Scraper      │  (Python - Port 5000)
│    (Python)     │
└─────────────────┘

All services communicate via the 'zambeel-network' Docker bridge network.
```

## 🔄 Rebuilding After Code Changes

When you make changes to the code, you need to rebuild the Docker images:

```bash
# Stop containers
./docker.sh down

# Rebuild and restart
./docker.sh build
./docker.sh up
```

Or in one command:
```bash
docker-compose up -d --build
```

## 🐛 Debugging

### View logs for specific service:
```bash
./docker.sh logs-frontend
./docker.sh logs-backend
./docker.sh logs-scraper
```

### Follow live logs:
```bash
./docker.sh logs-f
```

### Check container status:
```bash
./docker.sh status
```

### Access container shell:
```bash
# Frontend
docker exec -it zambeel-frontend-container sh

# Backend
docker exec -it zambeel-backend-container sh

# Scraper
docker exec -it zambeel-scraper-container sh
```

## 🔧 Manual Docker Commands

If you prefer manual control:

```bash
# Create network
docker network create zambeel-network

# Build images
docker build -t zambeel-frontend ./frontend
docker build -t zambeel-backend ./backend
docker build -t zambeel-scraper ./scrapper

# Run containers
docker run --name zambeel-scraper-container -p 127.0.0.1:5000:5000 --network zambeel-network --restart unless-stopped -d zambeel-scraper

docker run --name zambeel-backend-container -p 127.0.0.1:8080:8080 --network zambeel-network --restart unless-stopped -d zambeel-backend

docker run --name zambeel-frontend-container -p 127.0.0.1:3000:3000 --network zambeel-network --restart unless-stopped -d zambeel-frontend

# Connect services to network (if needed)
docker network connect zambeel-network zambeel-scraper-container
docker network connect zambeel-network zambeel-backend-container
docker network connect zambeel-network zambeel-frontend-container
```

## 🧹 Cleanup

Remove everything:
```bash
./docker.sh clean
```

Or manually:
```bash
docker-compose down
docker rmi zambeel-frontend zambeel-backend zambeel-scraper
docker network rm zambeel-network
```

## 📝 Environment Variables

Each service can use environment variables defined in `docker-compose.yml`:

- **Frontend**: NODE_ENV=production
- **Backend**: NODE_ENV=production, PORT=8080
- **Scraper**: PYTHONUNBUFFERED=1

To customize, edit the `docker-compose.yml` file or create `.env` files.

## ⚙️ Health Checks

All services include health checks:
- **Frontend**: Checks if port 3000 responds
- **Backend**: Checks if /api endpoint responds
- **Scraper**: Checks if port 5000 responds

View health status:
```bash
docker ps
```

## 🔐 Network Configuration

All services run on a bridge network called `zambeel-network` which allows:
- Backend to communicate with Scraper
- Frontend to communicate with Backend
- Isolated from external networks (only exposed ports are accessible)

## 💡 Tips

1. **First time setup**: Run `./docker.sh build` before `./docker.sh up`
2. **Port conflicts**: Make sure ports 3000, 8080, and 5000 are available
3. **Logs**: Always check logs if services don't start properly
4. **Restart policy**: All containers restart automatically unless explicitly stopped
5. **Development**: For development, consider mounting volumes to avoid rebuilds

## 🆘 Common Issues

### Port already in use
```bash
# Find process using port
lsof -i :3000
lsof -i :8080
lsof -i :5000

# Kill process or stop existing containers
docker ps -a
docker stop <container_name>
```

### Services can't communicate
```bash
# Check network
docker network inspect zambeel-network

# Ensure all containers are on the network
docker network connect zambeel-network <container_name>
```

### Out of disk space
```bash
# Clean up unused Docker resources
docker system prune -a
```
