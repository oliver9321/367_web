import * as path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'
import { fileURLToPath } from 'node:url'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import dotenv from "dotenv";
import fastifyCors from '@fastify/cors';
import fastifyMongo from '@fastify/mongodb'; // ✅ Importar en lugar de require

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {} & Partial<AutoloadPluginOptions>

const options: AppOptions = {}

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // ✅ Configurar Fastify instance dentro de la función
  fastify.log.info('Starting server configuration...');
  
  // 1. Registrar CORS
  await fastify.register(fastifyCors, { 
    origin: '*' 
  });

  // 2. Registrar MongoDB
  await fastify.register(fastifyMongo, {
    forceClose: true,
    url: process.env.MONGO_URL || "mongodb://localhost:27017/test_database" // ✅ agregar nombre de BD
  });

  // 3. Registrar Swagger
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
      }
    }
  });

  // 4. Registrar Swagger UI
  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list'
    }
  });

  // 5. Cargar otros plugins
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
    ignoreFilter: (path) => path.includes('swagger')
  });

  // 6. Cargar rutas
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
    routeParams: true
  });

  fastify.log.info('Server configuration completed!');
}

// ✅ NO exportar fastify instance, solo la función app
export default app;
export { app, options };