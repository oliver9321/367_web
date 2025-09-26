// server.ts
import Fastify from "fastify";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import fastifyCors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

dotenv.config();

// -----------------------------
// Fastify instance
// -----------------------------
const fastify = Fastify({ logger: true });
fastify.register(fastifyCors, { origin: "*" });

// -----------------------------
// Conexión MongoDB
// -----------------------------
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "test_database";
mongoose.connect(`${MONGO_URL}/${DB_NAME}`);

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key-here";

// -----------------------------
// Modelos
// -----------------------------
enum UserRole {
  ADMIN = "admin",
  REVIEWER = "reviewer",
}

enum CaseStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  OVERDUE = "overdue",
}

const userSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  email: String,
  password: String,
  full_name: String,
  role: { type: String, enum: Object.values(UserRole), default: UserRole.REVIEWER },
  badge_id: String,
  rating: { type: Number, default: 4.0 },
  created_at: { type: Date, default: Date.now },
});

const caseSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  case_number: String,
  title: String,
  description: String,
  license_plate: String,
  location: String,
  coordinates: String,
  images: [{ url: String, description: String }],
  status: { type: String, enum: Object.values(CaseStatus), default: CaseStatus.PENDING },
  traffic_law: Object,
  fine_amount: Number,
  submitted_at: { type: Date, default: Date.now },
  reviewed_at: Date,
  reviewed_by: String,
  review_comments: String,
  due_date: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
});

const User = mongoose.model("User", userSchema);
const Case = mongoose.model("Case", caseSchema);

// -----------------------------
// Helpers
// -----------------------------
const createAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: "24h" });
};

const authMiddleware = async (req: any, reply: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return reply.status(401).send({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, SECRET_KEY) as any;

    const user = await User.findOne({ id: payload.sub });
    if (!user) return reply.status(401).send({ message: "User not found" });

    req.user = user;
  } catch (err) {
    return reply.status(401).send({ message: "Invalid token" });
  }
};

// -----------------------------
// Swagger Config
// -----------------------------
fastify.register(fastifySwagger, {
  swagger: {
    info: {
      title: "367 API",
      description: "API para gestión de usuarios y casos de tránsito",
      version: "1.0.0",
    },
    host: "localhost:3000",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
      bearerAuth: {
        type: "apiKey",
        name: "Authorization",
        in: "header",
      },
    },
  },
});
fastify.register(fastifySwaggerUi, { routePrefix: "/docs" });

// -----------------------------
// Rutas: Auth
// -----------------------------
fastify.post("/api/auth/register", async (req, reply) => {
  const { email, password, full_name, role, badge_id } = req.body as any;

  const existing = await User.findOne({ email });
  if (existing) return reply.status(400).send({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, full_name, role, badge_id, password: hashedPassword });
  await user.save();

  const token = createAccessToken(user.id);
  return { access_token: token, token_type: "bearer", user };
});

fastify.post("/api/auth/login", async (req, reply) => {
  const { email, password } = req.body as any;

  const user = await User.findOne({ email });
  if (!user) return reply.status(401).send({ message: "Invalid credentials" });

  if (!password || !user.password) {
  throw new Error("Contraseña inválida");
}

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return reply.status(401).send({ message: "Invalid credentials" });

  const token = createAccessToken(user.id);
  return { access_token: token, token_type: "bearer", user };
});

fastify.get("/api/auth/me", { preHandler: authMiddleware }, async (req: any) => {
  return req.user;
});

// -----------------------------
// Rutas: Cases
// -----------------------------
fastify.get("/api/cases", { preHandler: authMiddleware }, async (req: any) => {
  const { status } = req.query as any;
  const query: any = {};
  if (status) query.status = status;

  const cases = await Case.find(query).sort({ submitted_at: -1 }).limit(1000);
  return cases;
});

fastify.post("/api/cases", { preHandler: authMiddleware }, async (req: any) => {
  const { title, description, license_plate, location, coordinates, images } = req.body;
  const caseData = new Case({
    case_number: `#${uuidv4().slice(0, 6).toUpperCase()}`,
    title,
    description,
    license_plate,
    location,
    coordinates,
    images,
  });
  await caseData.save();
  return caseData;
});

// -----------------------------
// Init
// -----------------------------
const PORT = Number(process.env.PORT) || 3000;
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    fastify.log.info(`🚀 Server running on http://localhost:${PORT}`);
    fastify.log.info(`📖 Swagger docs available at http://localhost:${PORT}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
