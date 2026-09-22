import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { routes } from "./routes";

export const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// Health Check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "DevShowcase API",
    version: "1.0.0",
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

// Rotas da API
app.use("/api", routes);

// Middleware centralizado de tratamento de erros
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  // Erros de validação do Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  // Erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: "Conflict",
        message: `Unique constraint failed on field(s): ${(err.meta?.target as string[])?.join(", ") || "unknown"}`,
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        error: "Not Found",
        message: "Resource not found in database",
      });
      return;
    }

    if (err.code === "P2003") {
      res.status(400).json({
        error: "Foreign Key Constraint Failed",
        message: "Referenced foreign key does not exist",
      });
      return;
    }
  }

  console.error("Unhandled Application Error:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 DevShowcase API running on http://localhost:${PORT}`);
  });
}
