# TableHop Deployment Guide

This guide covers deploying TableHop to various platforms using Docker.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (managed or self-hosted)
- Domain name (optional but recommended)

## Environment Variables

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Session Security
SESSION_SECRET=your-super-secret-session-key-min-32-characters

# Frontend URL (for CORS)
FRONTEND_URL=https://your-domain.com

# API URL (for frontend)
API_URL=https://api.your-domain.com
```

### Optional Environment Variables

```bash
# Node Environment
NODE_ENV=production

# Port (defaults to 4000 for API, 80 for web)
PORT=4000
```

## Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TableHop
   ```

2. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database:**
   ```bash
   # Create admin user
   docker-compose exec api npm run create-admin
   
   # Create sample data (optional)
   docker-compose exec api npm run create-neighbourhoods
   docker-compose exec api npm run create-events
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:4000
   - API Docs: http://localhost:4000/api-docs

## Production Deployment

### Option 1: Qovery Deployment

1. **Connect your repository to Qovery**

2. **Create a new application in Qovery**

3. **Set up environment variables:**
   - Go to your application settings
   - Add all required environment variables listed above

4. **Deploy using Docker Compose:**
   ```bash
   # Use the production compose file
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 2: Docker Compose on VPS

1. **Set up your server:**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone and deploy:**
   ```bash
   git clone <repository-url>
   cd TableHop
   
   # Create .env file with your environment variables
   cp .env.example .env
   nano .env
   
   # Deploy
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 3: Kubernetes

1. **Create Kubernetes manifests:**
   ```bash
   # Create namespace
   kubectl create namespace tablehop
   
   # Apply secrets
   kubectl apply -f k8s/secrets.yaml
   
   # Apply deployments
   kubectl apply -f k8s/
   ```

## Database Setup

### PostgreSQL Requirements

- **Version:** 15 or higher
- **Extensions:** None required
- **Connection:** SSL recommended for production

### Database Initialization

The application will automatically create the required tables on first run. You can also manually initialize:

```bash
# Push schema to database
docker-compose exec api npm run db:push

# Create admin user
docker-compose exec api npm run create-admin
```

## SSL/TLS Configuration

For production deployments, ensure SSL is properly configured:

1. **Frontend (Nginx):**
   - Configure SSL certificates in nginx.conf
   - Redirect HTTP to HTTPS

2. **API:**
   - Use a reverse proxy (Nginx/Traefik) for SSL termination
   - Or configure SSL directly in the Node.js application

## Monitoring and Health Checks

### Health Check Endpoints

- **API Health:** `GET /health`
- **API Documentation:** `GET /api-docs`

### Logging

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f web

# Production logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Check DATABASE_URL format
   - Verify database is accessible
   - Check SSL configuration

2. **Session Issues:**
   - Ensure SESSION_SECRET is set and secure
   - Check cookie domain settings
   - Verify CORS configuration

3. **Frontend Can't Connect to API:**
   - Check VITE_API_URL environment variable
   - Verify CORS settings in API
   - Check network connectivity

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs api

# Access container shell
docker-compose exec api sh

# Check database connection
docker-compose exec api npm run db:push
```

## Security Considerations

1. **Environment Variables:**
   - Never commit secrets to version control
   - Use secure secret management
   - Rotate secrets regularly

2. **Database:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access

3. **Application:**
   - Keep dependencies updated
   - Use HTTPS in production
   - Implement rate limiting

## Performance Optimization

1. **Database:**
   - Add appropriate indexes
   - Use connection pooling
   - Monitor query performance

2. **Application:**
   - Enable compression
   - Use CDN for static assets
   - Implement caching strategies

## Backup Strategy

1. **Database Backups:**
   ```bash
   # Create backup
   docker-compose exec postgres pg_dump -U postgres tablehop > backup.sql
   
   # Restore backup
   docker-compose exec -T postgres psql -U postgres tablehop < backup.sql
   ```

2. **Application Backups:**
   - Backup environment variables
   - Backup configuration files
   - Document deployment procedures

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment configuration
4. Test with local development setup first
