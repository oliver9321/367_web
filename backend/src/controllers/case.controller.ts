// controllers/case.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { Case } from "../models/case.model.js";
import { v4 as uuidv4 } from "uuid";

// FUNCIÓN DE UTILIDAD
const generateCaseNumber = (): string => {
  return `CASE-${uuidv4().slice(0, 8).toUpperCase()}`;
};

export const getCases = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { status } = req.query as any;
    const query: any = status ? { status } : {};

    const cases = await Case.find(query).sort({ submitted_at: -1 }).limit(100);
    return cases;
  } catch (error) {
    console.error('Get cases error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

export const createCase = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = req.body as any;
    
    // ✅ Obtener usuario del middleware
    const user = (req as any).user;
    if (!user) {
      return reply.status(401).send({ error: 'Not authenticated' });
    }

    const caseData = new Case({
      ...body,
      case_number: generateCaseNumber(),
      status: 'pending',
      // ✅ Agregar información del usuario que crea el caso
      submitted_by: user.id,
    });
    
    await caseData.save();
    return caseData;
  } catch (error) {
    console.error('Create case error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getCaseById = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const caseItem = await Case.findById(id);
    
    if (!caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }
    
    return caseItem;
  } catch (error) {
    console.error('Get case by ID error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

export const updateCase = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as any;

    const caseItem = await Case.findById(id);
    if (!caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    // Actualizar solo los campos permitidos
    const updatableFields = ['title', 'description', 'license_plate', 'location', 'coordinates', 'status'];
    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        (caseItem as any)[field] = body[field];
      }
    });

    await caseItem.save();
    return caseItem;
  } catch (error) {
    console.error('Update case error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};

export const deleteCase = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const caseItem = await Case.findById(id);
    if (!caseItem) {
      return reply.status(404).send({ error: 'Case not found' });
    }

    await caseItem.deleteOne();
    return { message: 'Case deleted successfully' };
  } catch (error) {
    console.error('Delete case error:', error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};
