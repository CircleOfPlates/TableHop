# TableHop 🍽️

A full-stack neighborhood dinner party platform that connects neighbors through weekly rotating dinner parties and social dining experiences.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL database

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TableHop
   ```

2. **Start the development environment:**
   ```bash
   # Using Docker (recommended)
   npm run docker:dev
   
   # Or using local Node.js
   npm install
   npm run dev
   ```

3. **Initialize the database:**
   ```bash
   # Create admin user
   npm run create-admin
   
   # Create sample data (optional)
   npm run create-neighbourhoods
   npm run create-events
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:4000
   - API Docs: http://localhost:4000/api-docs

## 🐳 Docker Deployment

### Production Deployment

1. **Configure environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

2. **Deploy:**
   ```bash
   # Using the deployment script
   ./deploy.sh
   
   # Or manually
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Environment Variables

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret key for session encryption
- `FRONTEND_URL` - Frontend URL for CORS
- `API_URL` - API URL for frontend

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn/ui components
- Wouter for routing
- TanStack Query for data fetching

**Backend:**
- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Session-based authentication
- Swagger API documentation

**Infrastructure:**
- Docker containers
- Nginx for frontend serving
- Multi-stage builds for optimization

### Project Structure

```
TableHop/
├── apps/
│   ├── api/          # Backend API
│   └── web/          # Frontend application
├── docker-compose.yml           # Development environment
├── docker-compose.prod.yml      # Production environment
├── deploy.sh                    # Deployment script
└── DEPLOYMENT.md               # Detailed deployment guide
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both API and web
npm run dev:api          # Start API only
npm run dev:web          # Start web only

# Building
npm run build            # Build both apps
npm run build:api        # Build API only
npm run build:web        # Build web only

# Database
npm run db:push          # Push schema to database
npm run create-admin     # Create admin user
npm run create-neighbourhoods  # Create sample neighborhoods
npm run create-events    # Create sample events

# Docker
npm run docker:dev       # Start development containers
npm run docker:prod      # Start production containers
npm run docker:build     # Build Docker images
npm run docker:logs      # View container logs
```

### Database Management

```bash
# Start database
npm run db:up

# Push schema changes
npm run db:push

# Open database studio
npm run db:studio
```

## 🌐 Deployment

### Supported Platforms

- **Qovery** - Easy Docker deployment
- **Railway** - Full-stack platform
- **Render** - Web services and static sites
- **Vercel + Supabase** - Serverless + database
- **Self-hosted** - Docker on VPS

### Quick Deployment to Qovery

1. Connect your repository to Qovery
2. Set environment variables
3. Deploy using Docker Compose

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📚 Features

### Core Functionality

- **User Authentication** - Secure signup/login with session management
- **Event Management** - Create and manage dinner party events
- **Matching Algorithm** - Intelligent participant matching
- **Admin Dashboard** - Comprehensive admin tools and analytics
- **Gamification** - Points, badges, and leaderboards
- **Post-Event Experience** - Ratings, reviews, and testimonials

### User Experience

- **Modern UI** - Clean, responsive design with Shadcn/ui
- **Dark Mode** - Toggle between light and dark themes
- **Mobile Responsive** - Works on all device sizes
- **Real-time Updates** - Live data updates with TanStack Query
- **Accessibility** - WCAG 2.1 AA compliant

## 🔒 Security

- Session-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation with Zod
- SQL injection protection with Drizzle ORM

## 📊 Monitoring

- Health check endpoints
- Comprehensive logging
- Error tracking
- Performance monitoring
- Database connection pooling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For deployment and technical support:
1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review the troubleshooting section
3. Check application logs
4. Verify environment configuration

---

**Built with ❤️ for bringing neighbors together through the joy of shared meals.**
