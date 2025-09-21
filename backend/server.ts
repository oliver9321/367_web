// server.ts
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // sin restricciones

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
// Middleware: auth
// -----------------------------
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token" });

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, SECRET_KEY) as any;

    const user = await User.findOne({ id: payload.sub });
    if (!user) return res.status(401).json({ message: "User not found" });

    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// -----------------------------
// Helpers
// -----------------------------
const createAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: "24h" });
};

// -----------------------------
// Swagger Config con schemas
// -----------------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "367 API",
      version: "1.0.0",
      description: "API para gestión de usuarios y casos de tránsito",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string" },
            full_name: { type: "string" },
            role: { type: "string", enum: ["admin", "reviewer"] },
            badge_id: { type: "string" },
            rating: { type: "number" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        UserCreate: {
          type: "object",
          required: ["email", "password", "full_name", "badge_id"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
            full_name: { type: "string" },
            role: { type: "string", enum: ["admin", "reviewer"] },
            badge_id: { type: "string" },
          },
        },
        UserLogin: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
        },
        Case: {
          type: "object",
          properties: {
            id: { type: "string" },
            case_number: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            license_plate: { type: "string" },
            location: { type: "string" },
            status: { type: "string", enum: ["pending", "approved", "rejected", "overdue"] },
            submitted_at: { type: "string", format: "date-time" },
          },
        },
        CaseCreate: {
          type: "object",
          required: ["title", "description", "license_plate", "location"],
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            license_plate: { type: "string" },
            location: { type: "string" },
            coordinates: { type: "string" },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  url: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./server.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// -----------------------------
// Rutas: auth
// -----------------------------
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       200:
 *         description: Usuario creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, password, full_name, role, badge_id } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, full_name, role, badge_id, password: hashedPassword });
  await user.save();

  const token = createAccessToken(user.id);
  res.json({ access_token: token, token_type: "bearer", user });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                 token_type:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = createAccessToken(user.id);
  res.json({ access_token: token, token_type: "bearer", user });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json((req as any).user);
});

// -----------------------------
// Rutas: cases
// -----------------------------
/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: Listar casos
 *     security:
 *       - bearerAuth: []
 *     tags: [Cases]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, overdue]
 *     responses:
 *       200:
 *         description: Lista de casos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Case'
 */
app.get("/api/cases", authMiddleware, async (req, res) => {
  const { status } = req.query;
  const query: any = {};
  if (status) query.status = status;

  const cases = await Case.find(query).sort({ submitted_at: -1 }).limit(1000);
  res.json(cases);
});

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Crear caso
 *     security:
 *       - bearerAuth: []
 *     tags: [Cases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CaseCreate'
 *     responses:
 *       200:
 *         description: Caso creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Case'
 */
app.post("/api/cases", authMiddleware, async (req, res) => {
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
  res.json(caseData);
});

// -----------------------------
// Init
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📖 Swagger docs available at http://localhost:${PORT}/docs`);
});
