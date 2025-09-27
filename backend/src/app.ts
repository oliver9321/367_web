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
import { errorHandler } from './hooks/error.hook.js';
import responseMiddleware from './middlewares/response.middleware.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {} & Partial<AutoloadPluginOptions>

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  fastify.log.info('Starting server configuration...');
  
  // 1. ✅ MANEJADOR GLOBAL DE ERRORES (PRIMERO)
  fastify.setErrorHandler(errorHandler);
  
  // 2. ✅ MIDDLEWARE DE FORMATO DE RESPUESTAS
  fastify.addHook('onRequest', responseMiddleware);
  
  // 3. Registrar CORS (importante para app móvil)
  await fastify.register(fastifyCors, { 
    origin: '*', // En producción, especifica tu dominio móvil
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // 4. ✅ CONFIGURAR MONGODB CON @fastify/mongodb
  await fastify.register(fastifyMongo, {
    forceClose: true,
    url: process.env.MONGO_URL || "mongodb://localhost:27017/case_management_db",
    database: process.env.DB_NAME || "case_management_db"
  });

  // 5. ✅ VERIFICAR CONEXIÓN MONGODB
  fastify.addHook('onReady', async () => {
    try {
      const db = fastify.mongo.db;
      if (!db) throw new Error('MongoDB database not available');
      
      // Crear índices para mejor performance
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('cases').createIndex({ case_number: 1 }, { unique: true });
      await db.collection('cases').createIndex({ status: 1 });
      await db.collection('cases').createIndex({ submitted_by: 1 });
      
      await db.admin().ping();
      fastify.log.info('✅ MongoDB connected successfully with indexes!');
      
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
        description: 'API para gestión de casos - Mobile App',
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

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' }
  });

  // 7. Cargar plugins y rutas
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
  });

  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
    routeParams: true
  });

  // 8. ✅ HEALTH CHECK OPTIMIZADO PARA MOBILE
  fastify.get('/health', async (request, reply) => {
    try {
      const db = fastify.mongo.db;
      if (!db) throw new Error('Database not connected');
      
      const startTime = Date.now();
      await db.admin().ping();
      const dbResponseTime = Date.now() - startTime;
      
      return { 
        status: 'OK', 
        database: 'Connected',
        response_time: `${dbResponseTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      reply.status(503);
      throw new Error('Service unavailable');
    }
  });

  fastify.log.info('🚀 Mobile API Server configuration completed!');
}

export default app;
export { app, options };