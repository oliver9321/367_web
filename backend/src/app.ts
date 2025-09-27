// app.ts
import * as path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'
import { fileURLToPath } from 'node:url'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import dotenv from "dotenv";
import fastifyCors from '@fastify/cors';
import fastifyMongo from '@fastify/mongodb';

// Importar middlewares y hooks
import responseMiddleware from './middlewares/response.middleware.js';
import { errorHandler } from './hooks/error.hook.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {} & Partial<AutoloadPluginOptions>

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  fastify.log.info('Starting server configuration...');
  
  // 1. MANEJADOR GLOBAL
  fastify.setErrorHandler(errorHandler);
  
  // 2. MIDDLEWARE DE FORMATO DE RESPUESTAS
  fastify.addHook('onRequest', responseMiddleware);
  
  // 3. Registrar CORS
  await fastify.register(fastifyCors, { 
    origin: '*' 
  });

  // 4. Configurar MongoDB
  await fastify.register(fastifyMongo, {
    forceClose: true,
    url: process.env.MONGO_URL || "mongodb://localhost:27017/case_management_db",
    database: process.env.DB_NAME || "case_management_db"
  });

  // 5. Verificar conexión MongoDB
  fastify.addHook('onReady', async () => {
    try {
      const db = fastify.mongo.db;
      if (!db) throw new Error('MongoDB database not available');
      
      await db.admin().ping();
      fastify.log.info('✅ MongoDB connected successfully!');
    } catch (error) {
      fastify.log.error('💥 MongoDB connection failed');
      throw error;
    }
  });

  // 6. Registrar Swagger
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Case Management API',
        description: 'API para gestión de casos y autenticación',
        version: '1.0.0'
      },
      servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  // 7. Registrar Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' }
  });

  // 8. Cargar plugins
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
    ignoreFilter: (path) => path.includes('swagger')
  });

  // 9. Cargar rutas
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
    routeParams: true
  });

  // 10. Health check endpoint
  fastify.get('/health', async (request, reply) => {
    try {
      const db = fastify.mongo.db;
      if (!db) throw new Error('Database not connected');
      
      await db.admin().ping();
      return { 
        status: 'OK', 
        database: 'Connected', 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      reply.status(503);
      throw new Error('Database connection failed');
    }
  });

  fastify.log.info('Server configuration completed!');
}

export default app;
export { app, options };