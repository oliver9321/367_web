// hooks/error.hook.ts
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ResponseUtils, ErrorCodes } from '../middlewares/response.middleware.js';

export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
  console.error('Global error handler:', error);
  
  // Si ya se envió una respuesta, no hacer nada
  if (reply.sent) return;
  
  let statusCode = error.statusCode || 500;
  let errorCode = '';
  let message = 'Error interno del servidor';
  let details: any = undefined;
  
  // Mapear errores específicos de Fastify
  if (error.validation) {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    message = 'Error de validación en los datos de entrada';
    details = error.validation;
  }
  
  // Manejar errores de MongoDB
  else if (error.name === 'MongoError') {
    if (error.code === '11000') {
      statusCode = 409;
      errorCode = ErrorCodes.USER_ALREADY_EXISTS;
      message = 'El recurso ya existe';
    }
  }
  
  // Manejar errores de JWT
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = ErrorCodes.INVALID_TOKEN;
    message = 'Token inválido';
  }
  
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = ErrorCodes.INVALID_TOKEN;
    message = 'Token expirado';
  }
  
  // Usar el mensaje del error si está disponible y no es un error 500
  else if (error.message && statusCode !== 500) {
    message = error.message;
  }
  
  // En desarrollo, incluir detalles del error
  if (process.env.NODE_ENV === 'development') {
    details = {
      stack: error.stack,
      originalError: error.message
    };
  }
  
  const errorResponse = ResponseUtils.error(errorCode, message, details);
  
  reply.status(statusCode).send(errorResponse);
};