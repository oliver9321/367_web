// middlewares/response.middleware.ts
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';

// Tipos para la respuesta estandarizada
interface SuccessResponse<T = any> {
  success: true;
  data: T;
  error: null;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Códigos de error comunes
export const ErrorCodes = {
  // Autenticación
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  FORBIDDEN: 'FORBIDDEN',

  // Usuarios
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Casos
  CASE_NOT_FOUND: 'CASE_NOT_FOUND',
  CASE_VALIDATION_ERROR: 'CASE_VALIDATION_ERROR',

  // General
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST'
} as const;

// Utilidades para crear respuestas
export const ResponseUtils = {
  // Respuesta exitosa
  success: <T>(data: T): SuccessResponse<T> => ({
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString()
  }),

  // Respuesta de error
  error: (code: string, message: string, details?: any): ErrorResponse => ({
    success: false,
    data: null,
    error: {
      code,
      message,
      ...(details && { details })
    },
    timestamp: new Date().toISOString()
  }),

  // Errores predefinidos
  notFound: (resource: string) =>
    ResponseUtils.error(ErrorCodes.NOT_FOUND, `${resource} no encontrado`),

  unauthorized: () =>
    ResponseUtils.error(ErrorCodes.UNAUTHORIZED, 'No autorizado'),

  invalidCredentials: () =>
    ResponseUtils.error(ErrorCodes.INVALID_CREDENTIALS, 'Credenciales inválidas'),

  validationError: (details?: any) =>
    ResponseUtils.error(ErrorCodes.VALIDATION_ERROR, 'Error de validación', details),

  internalError: () =>
    ResponseUtils.error(ErrorCodes.INTERNAL_ERROR, 'Error interno del servidor')
};

// Middleware principal para formatear respuestas
export const responseMiddleware = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  // Evitar transformar rutas especiales (ej. swagger-ui y favicon)
  if (request.url.startsWith('/docs') || request.url === '/favicon.ico') {
    return done();
  }

  // Guardar el método original de reply.send
  const originalSend = reply.send;

  // Override del método send para formatear respuestas exitosas
  reply.send = function (data: any) {
    // Si ya es una respuesta formateada, no hacer nada
    if (data && typeof data === 'object' && 'success' in data) {
      return originalSend.call(this, data);
    }

    // Si es un error (statusCode >= 400), formatear como error
    if (reply.statusCode >= 400) {
      const errorResponse = ResponseUtils.error(
        getErrorCode(reply.statusCode),
        typeof data === 'string' ? data : 'Error en la solicitud',
        typeof data === 'object' ? data : undefined
      );
      return originalSend.call(this, errorResponse);
    }

    // Formatear respuesta exitosa
    const formattedResponse = ResponseUtils.success(data);
    return originalSend.call(this, formattedResponse);
  };

  done();
};

// Función helper para mapear códigos de estado a códigos de error
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400: return ErrorCodes.BAD_REQUEST;
    case 401: return ErrorCodes.UNAUTHORIZED;
    case 403: return ErrorCodes.FORBIDDEN;
    case 404: return ErrorCodes.NOT_FOUND;
    case 409: return ErrorCodes.USER_ALREADY_EXISTS;
    case 422: return ErrorCodes.VALIDATION_ERROR;
    default: return ErrorCodes.INTERNAL_ERROR;
  }
}

export default responseMiddleware;
