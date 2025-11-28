#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Zambeel Docker Management Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to display usage
usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up          - Build and start all services"
    echo "  down        - Stop and remove all containers"
    echo "  restart     - Restart all services"
    echo "  build       - Rebuild all Docker images"
    echo "  logs        - Show logs from all services"
    echo "  logs-f      - Follow logs from all services"
    echo "  status      - Show status of all containers"
    echo "  clean       - Stop containers and remove images"
    echo "  help        - Show this help message"
    echo ""
    echo "Service-specific commands:"
    echo "  logs-scraper   - Show scraper logs"
    echo "  logs-backend   - Show backend logs"
    echo "  logs-frontend  - Show frontend logs"
}

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed${NC}"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

case "$1" in
    up)
        echo -e "${YELLOW}Building and starting all services...${NC}"
        $DOCKER_COMPOSE up -d --build
        echo -e "${GREEN}All services are up!${NC}"
        echo ""
        echo "Access the services at:"
        echo "  Frontend: http://localhost:3000"
        echo "  Backend:  http://localhost:8080"
        echo "  Scraper:  http://localhost:5000"
        ;;
    
    down)
        echo -e "${YELLOW}Stopping all services...${NC}"
        $DOCKER_COMPOSE down
        echo -e "${GREEN}All services stopped${NC}"
        ;;
    
    restart)
        echo -e "${YELLOW}Restarting all services...${NC}"
        $DOCKER_COMPOSE restart
        echo -e "${GREEN}All services restarted${NC}"
        ;;
    
    build)
        echo -e "${YELLOW}Rebuilding all Docker images...${NC}"
        $DOCKER_COMPOSE build --no-cache
        echo -e "${GREEN}All images rebuilt${NC}"
        ;;
    
    logs)
        $DOCKER_COMPOSE logs
        ;;
    
    logs-f)
        echo -e "${YELLOW}Following logs (Ctrl+C to stop)...${NC}"
        $DOCKER_COMPOSE logs -f
        ;;
    
    logs-scraper)
        $DOCKER_COMPOSE logs scraper
        ;;
    
    logs-backend)
        $DOCKER_COMPOSE logs backend
        ;;
    
    logs-frontend)
        $DOCKER_COMPOSE logs frontend
        ;;
    
    status)
        echo -e "${YELLOW}Container Status:${NC}"
        $DOCKER_COMPOSE ps
        echo ""
        echo -e "${YELLOW}Network Status:${NC}"
        docker network inspect zambeel-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{println}}{{end}}' 2>/dev/null || echo "Network not created yet"
        ;;
    
    clean)
        echo -e "${YELLOW}Cleaning up containers and images...${NC}"
        $DOCKER_COMPOSE down
        docker rmi zambeel-frontend zambeel-backend zambeel-scraper 2>/dev/null || true
        echo -e "${GREEN}Cleanup complete${NC}"
        ;;
    
    help|--help|-h)
        usage
        ;;
    
    *)
        echo -e "${RED}Invalid command: $1${NC}"
        echo ""
        usage
        exit 1
        ;;
esac
