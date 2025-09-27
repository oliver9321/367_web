// controllers/auth.controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { createAccessToken } from "../utils/jwt.util.js";

// --- FUNCIÓN DE UTILIDAD ---
const createAuthResponse = (user: any) => {
  const token = createAccessToken(user.id);
  // Seguridad: Excluimos el password del objeto user devuelto
  const safeUser = user.toObject ? user.toObject() : { ...user }; 
  delete safeUser.password; 
  
  return { 
    access_token: token, 
    token_type: "Bearer", 
    user: safeUser 
  };
};

export const registerUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password, name } = req.body as any; 

    const existing = await User.findOne({ email });
    if (existing) {
      return reply.status(400).send({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      name, 
      password: hashedPassword 
    });
    
    await user.save();

    return createAuthResponse(user);
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send({ message: "Internal server error" });
  }
};

export const loginUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, password } = req.body as any;

    // IMPORTANTE: Incluir el password para la comparación
    const user = await User.findOne({ email }).select('+password'); 
    if (!user) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return reply.status(401).send({ message: "Invalid credentials" });
    }

    return createAuthResponse(user);
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({ message: "Internal server error" });
  }
};

export const getMe = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    // El middleware ya adjuntó el usuario
    const user = (req as any).user; 
    if (!user) {
      return reply.status(401).send({ message: "Not authenticated" });
    }
    
    // Asegurar que no enviamos el password
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;
    
    return safeUser;
  } catch (error) {
    console.error('GetMe error:', error);
    return reply.status(500).send({ message: "Internal server error" });
  }
};