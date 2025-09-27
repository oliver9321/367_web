// routes/auth/index.ts
import { FastifyPluginAsync } from 'fastify'
import { registerUser, loginUser, getMe } from '../../controllers/auth.controller.js'
import { authMiddleware } from '../../middlewares/auth.middleware.js'

const authRoutes: FastifyPluginAsync = async (fastify, options) => {
  
  // POST /auth/register - Registrar usuario
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register new user',
      description: 'Create a new user account',
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'User email address'
          },
          password: { 
            type: 'string', 
            minLength: 6,
            description: 'User password (min 6 characters)'
          },
          name: {  
            type: 'string',
            description: 'User full name'
          }
        }
      },
      response: {
        200: {
          description: 'Registration successful',
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }, 
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
          description: 'Bad request - Invalid data',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        409: {
          description: 'Conflict - User already exists',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, registerUser) 

  // POST /auth/login - Login usuario
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { 
            type: 'string', 
            format: 'email',
            description: 'User email address'
          },
          password: { 
            type: 'string',
            description: 'User password'
          }
        }
      },
      response: {
        200: {
          description: 'Login successful',
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' }, 
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - Invalid credentials',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, loginUser)

  // GET /auth/me - Obtener usuario actual
  fastify.get('/me', {
    preHandler: authMiddleware, // Middleware de autenticación
    schema: {
      tags: ['Auth'],
      summary: 'Get current user',
      description: 'Get information about the currently authenticated user',
      response: {
        200: {
          description: 'User information retrieved successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' }, 
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        401: {
          description: 'Unauthorized - Authentication required',
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      },
      security: [{ bearerAuth: [] }]
    }
  }, getMe)
}

export default authRoutes