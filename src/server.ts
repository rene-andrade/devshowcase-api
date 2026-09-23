import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { routes } from "./routes";
import { openApiSpec } from "./docs/openapi";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

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

// Documentação interativa (Swagger / OpenAPI)
app.get("/api/docs.json", (_req: Request, res: Response) => {
  res.json(openApiSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Rotas da API
app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 DevShowcase API running on http://localhost:${PORT}`);
  });
}
