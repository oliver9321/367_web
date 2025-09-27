import jwt from "jsonwebtoken";
const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export const createAccessToken = (userId: string) => {
  return jwt.sign({ sub: userId }, SECRET_KEY, { expiresIn: "24h" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET_KEY);
};
