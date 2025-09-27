// routes/cases/index.ts
import { FastifyPluginAsync } from 'fastify'
import { getCases, createCase, getCaseById, updateCase } from '../../controllers/case.controller.js'
import { authMiddleware } from '../../middlewares/auth.middleware.js'
import { CaseStatus } from '../../models/case.model.js'

const casesRoutes: FastifyPluginAsync = async (fastify, options) => {
  
  // GET /cases - Obtener todos los casos
  fastify.get('/', {
    preHandler: [authMiddleware], 
    schema: {
      tags: ['Cases'],
      summary: 'Get all cases',
      description: 'Retrieve a list of all cases, optionally filtered by status',
      querystring: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: Object.values(CaseStatus), 
            description: 'Filter cases by status'
          }
        }
      },
      response: {
        200: {
          description: 'List of cases retrieved successfully',
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              case_number: { type: 'string' }, 
              title: { type: 'string' },
              description: { type: 'string' },
              license_plate: { type: 'string' },
              location: { type: 'string' },
              status: { 
                type: 'string', 
                enum: Object.values(CaseStatus)
              },
              submitted_at: { type: 'string', format: 'date-time' },
              due_date: { type: 'string', format: 'date-time' }
            }
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
  }, getCases) 

  // POST /cases - Crear nuevo caso
  fastify.post('/', {
    preHandler: [authMiddleware], 
    schema: {
      tags: ['Cases'],
      summary: 'Create a new case',
      description: 'Create a new case in the system',
      body: {
        type: 'object',
        required: ['title', 'description', 'license_plate', 'location'], 
        properties: {
          title: { 
            type: 'string', 
            minLength: 1,
            description: 'Title of the case'
          },
          description: { 
            type: 'string', 
            minLength: 1,
            description: 'Detailed description of the case'
          },
          license_plate: {
            type: 'string',
            description: 'Vehicle license plate'
          },
          location: {
            type: 'string',
            description: 'Location where the case occurred'
          },
          coordinates: {
            type: 'string',
            description: 'GPS coordinates (optional)'
          }
        }
      },
      response: {
        200: {
          description: 'Case created successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            case_number: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            license_plate: { type: 'string' },
            location: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'rejected', 'overdue'] 
            },
            submitted_at: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' }
          }
        },
        400: {
          description: 'Bad request - Invalid data',
          type: 'object',
          properties: {
            error: { type: 'string' }
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
  }, createCase) // ✅ Usar controller real

  // GET /cases/:id - Obtener caso específico
  fastify.get('/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Cases'],
      summary: 'Get case by ID',
      description: 'Retrieve a specific case by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Case ID' }
        }
      },
      response: {
        200: {
          description: 'Case retrieved successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            case_number: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            license_plate: { type: 'string' },
            location: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'rejected', 'overdue'] 
            },
            submitted_at: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          description: 'Case not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
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
  }, getCaseById)

  // PUT /cases/:id - Actualizar caso
  fastify.put('/:id', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Cases'],
      summary: 'Update a case',
      description: 'Update an existing case',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Case ID' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          license_plate: { type: 'string' },
          location: { type: 'string' },
          coordinates: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['pending', 'approved', 'rejected', 'overdue'] 
          }
        }
      },
      response: {
        200: {
          description: 'Case updated successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            case_number: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            license_plate: { type: 'string' },
            location: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'approved', 'rejected', 'overdue'] 
            },
            submitted_at: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date-time' }
          }
        },
        404: {
          description: 'Case not found',
          type: 'object',
          properties: {
            error: { type: 'string' }
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
  }, updateCase)
}

export default casesRoutes