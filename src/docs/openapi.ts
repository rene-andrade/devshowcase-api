import { z } from "zod";
import { createProfileSchema } from "../dtos/profile.dto";
import { createTechnologySchema } from "../dtos/technology.dto";
import { createProjectSchema } from "../dtos/project.dto";
import { createFeedbackSchema } from "../dtos/feedback.dto";

const toSchema = (schema: z.ZodType) => {
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
  return jsonSchema;
};

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const json = (schema: object) => ({ "application/json": { schema } });

const errorResponse = (description: string) => ({
  description,
  content: json(ref("Error")),
});

const intIdParam = {
  name: "id",
  in: "path",
  required: true,
  description: "ID inteiro do projeto",
  schema: { type: "integer", minimum: 1 },
};

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "DevShowcase API",
    version: "1.1.0",
    description:
      "API RESTful para divulgação de perfis de desenvolvedores, projetos, tecnologias e feedbacks.",
  },
  servers: [{ url: "/", description: "Servidor atual" }],
  tags: [
    { name: "Health" },
    { name: "Profiles" },
    { name: "Technologies" },
    { name: "Projects" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Serviço saudável",
            content: json({ type: "object", properties: { status: { type: "string", example: "healthy" } } }),
          },
        },
      },
    },
    "/api/profiles": {
      post: {
        tags: ["Profiles"],
        summary: "Cria um perfil de desenvolvedor",
        requestBody: { required: true, content: json(ref("CreateProfile")) },
        responses: {
          "201": { description: "Perfil criado", content: json(ref("Profile")) },
          "400": errorResponse("Dados inválidos"),
          "409": errorResponse("E-mail já cadastrado"),
        },
      },
    },
    "/api/profiles/{id}": {
      get: {
        tags: ["Profiles"],
        summary: "Busca um perfil por ID, com projetos, tecnologias e feedbacks",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "UUID v7 do perfil",
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Perfil encontrado", content: json(ref("Profile")) },
          "400": errorResponse("ID não é um UUID válido"),
          "404": errorResponse("Perfil não encontrado"),
        },
      },
    },
    "/api/technologies": {
      post: {
        tags: ["Technologies"],
        summary: "Cadastra uma tecnologia",
        requestBody: { required: true, content: json(ref("CreateTechnology")) },
        responses: {
          "201": { description: "Tecnologia criada", content: json(ref("Technology")) },
          "400": errorResponse("Dados inválidos"),
          "409": errorResponse("Tecnologia já cadastrada"),
        },
      },
      get: {
        tags: ["Technologies"],
        summary: "Lista as tecnologias em ordem alfabética",
        responses: {
          "200": {
            description: "Lista de tecnologias",
            content: json({ type: "array", items: ref("Technology") }),
          },
        },
      },
    },
    "/api/projects": {
      post: {
        tags: ["Projects"],
        summary: "Cria um projeto vinculado a um perfil e, opcionalmente, a tecnologias",
        requestBody: { required: true, content: json(ref("CreateProject")) },
        responses: {
          "201": { description: "Projeto criado", content: json(ref("Project")) },
          "400": errorResponse("Dados inválidos ou tecnologia inexistente"),
          "404": errorResponse("Perfil não encontrado"),
        },
      },
      get: {
        tags: ["Projects"],
        summary: "Lista projetos com filtro por tecnologia e paginação",
        parameters: [
          {
            name: "technology",
            in: "query",
            required: false,
            description: "Nome da tecnologia (sem diferenciar maiúsculas/minúsculas)",
            schema: { type: "string", example: "TypeScript" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
          },
        ],
        responses: {
          "200": { description: "Página de projetos", content: json(ref("PaginatedProjects")) },
          "400": errorResponse("Parâmetros de consulta inválidos"),
        },
      },
    },
    "/api/projects/{id}/feedbacks": {
      post: {
        tags: ["Projects"],
        summary: "Cadastra um feedback (nota 1 a 5) e recalcula a nota média do projeto",
        parameters: [intIdParam],
        requestBody: { required: true, content: json(ref("CreateFeedback")) },
        responses: {
          "201": { description: "Feedback criado", content: json(ref("FeedbackCreated")) },
          "400": errorResponse("Dados inválidos ou ID inválido"),
          "404": errorResponse("Projeto não encontrado"),
        },
      },
    },
    "/api/projects/{id}/upvote": {
      put: {
        tags: ["Projects"],
        summary: "Incrementa em 1 as curtidas do projeto",
        parameters: [intIdParam],
        responses: {
          "200": {
            description: "Curtidas atualizadas",
            content: json({
              type: "object",
              properties: { id: { type: "integer" }, upvotes: { type: "integer" } },
            }),
          },
          "400": errorResponse("ID inválido"),
          "404": errorResponse("Projeto não encontrado"),
        },
      },
    },
  },
  components: {
    schemas: {
      CreateProfile: toSchema(createProfileSchema),
      CreateTechnology: toSchema(createTechnologySchema),
      CreateProject: toSchema(createProjectSchema),
      CreateFeedback: toSchema(createFeedbackSchema),
      Profile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          bio: { type: ["string", "null"] },
          githubUrl: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          projects: { type: "array", items: ref("Project") },
        },
      },
      Technology: {
        type: "object",
        properties: { id: { type: "integer" }, name: { type: "string" } },
      },
      Feedback: {
        type: "object",
        properties: {
          id: { type: "integer" },
          author: { type: "string" },
          comment: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          projectId: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "integer" },
          title: { type: "string" },
          description: { type: "string" },
          repository: { type: "string" },
          upvotes: { type: "integer" },
          averageRating: { type: "number" },
          profileId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          technologies: { type: "array", items: ref("Technology") },
          feedbacks: { type: "array", items: ref("Feedback") },
        },
      },
      PaginatedProjects: {
        type: "object",
        properties: {
          data: { type: "array", items: ref("Project") },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      FeedbackCreated: {
        type: "object",
        properties: {
          feedback: ref("Feedback"),
          project: {
            type: "object",
            properties: {
              id: { type: "integer" },
              averageRating: { type: "number" },
              feedbackCount: { type: "integer" },
            },
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 400 },
          error: { type: "string", example: "Bad Request" },
          message: { type: "string", example: "Validation failed" },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: { field: { type: "string" }, message: { type: "string" } },
            },
          },
          path: { type: "string", example: "/api/projects/1/feedbacks" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
