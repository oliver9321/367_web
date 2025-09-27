// middlewares/auth.middleware.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyToken } from "../utils/jwt.util.js";
import { User } from "../models/user.model.js";

export const authMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return reply.status(401).send({ message: "Invalid token format" });
    }

    const payload = verifyToken(token) as any;
    
    if (!payload || !payload.sub) {
      return reply.status(401).send({ message: "Invalid token payload" });
    }

    const user = await User.findById(payload.sub); 
    if (!user) {
      return reply.status(401).send({ message: "User not found" });
    }

    (req as any).user = user;
    
  } catch (err) {
    console.error('Auth middleware error:', err);
    return reply.status(401).send({ message: "Invalid token" });
  }
};