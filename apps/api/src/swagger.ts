import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TableHop API',
      version: '1.0.0',
      description: 'API documentation for TableHop - A neighborhood dinner party platform',
      contact: {
        name: 'TableHop Team',
        email: 'support@tablehop.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4000',
        description: process.env.VERCEL_URL ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session-based authentication cookie'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            neighbourhood: { type: 'string', example: 'Downtown District' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Summer Rotating Dinner' },
            description: { type: 'string', example: 'Join us for a delightful rotating dinner experience' },
            date: { type: 'string', format: 'date', example: '2024-09-20' },
            startTime: { type: 'string', example: '18:00' },
            endTime: { type: 'string', example: '22:00' },
            totalSpots: { type: 'integer', example: 12 },
            spotsRemaining: { type: 'integer', example: 8 },
            format: { type: 'string', enum: ['rotating', 'hosted'], example: 'rotating' },
            isWaitlist: { type: 'boolean', example: false },
            neighbourhood: { type: 'string', example: 'Downtown District' }
          }
        },
        Participant: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            eventId: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            coursePreference: { type: 'string', enum: ['starter', 'main', 'dessert'], example: 'main' },
            courseAssigned: { type: 'string', enum: ['starter', 'main', 'dessert'], example: 'main' },
            isHost: { type: 'boolean', example: true },
            registeredAt: { type: 'string', format: 'date-time' }
          }
        },
        Rating: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            eventId: { type: 'integer', example: 1 },
            raterId: { type: 'integer', example: 1 },
            ratedUserId: { type: 'integer', example: 2 },
            overallRating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            foodQuality: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            hostExperience: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            socialConnection: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            review: { type: 'string', example: 'Amazing experience! Great food and company.' },
            favoriteMemory: { type: 'string', example: 'The dessert course was incredible!' },
            wouldRecommend: { type: 'boolean', example: true },
            isHostRating: { type: 'boolean', example: false },
            isGuestRating: { type: 'boolean', example: true }
          }
        },
        UserPoints: {
          type: 'object',
          properties: {
            currentPoints: { type: 'integer', example: 150 },
            totalPointsEarned: { type: 'integer', example: 200 },
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  pointsEarned: { type: 'integer', example: 25 },
                  reason: { type: 'string', example: 'Participated in dinner event' },
                  details: { type: 'string', example: 'Event: Summer Rotating Dinner' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        Badge: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'first_host' },
            name: { type: 'string', example: 'First Host' },
            description: { type: 'string', example: 'Hosted your first dinner event' },
            icon: { type: 'string', example: '🏠' },
            category: { type: 'string', enum: ['hosting', 'community', 'milestone'], example: 'hosting' },
            earned: { type: 'boolean', example: true },
            progress: { type: 'integer', example: 100 },
            current: { type: 'integer', example: 1 },
            required: { type: 'integer', example: 1 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            details: { type: 'object', description: 'Additional error details' }
          }
        }
      }
    },
    security: [
      {
        sessionAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/server.ts']
}

export const specs = swaggerJsdoc(options)
