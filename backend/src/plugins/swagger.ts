// plugins/swagger.ts
import { FastifyPluginAsync } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'

const swaggerPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Registrar Swagger
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Case Management API',
        description: 'API para gestión de casos y autenticación',
        version: '1.0.0'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: [
        { name: 'Auth', description: 'Endpoints de autenticación' },
        { name: 'Cases', description: 'Endpoints de gestión de casos' }
      ]
    }
  })

  // Registrar Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  })

  console.log('✅ Swagger plugin registered')
}

export default swaggerPlugin