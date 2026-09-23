import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  repository: z.string().trim().url("Repository must be a valid URL"),
  profileId: z.string().trim().uuid("profileId must be a valid UUID"),
  technologyIds: z
    .array(z.number().int().positive("Each technologyId must be a positive integer"))
    .optional()
    .default([]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const listProjectsQuerySchema = z.object({
  technology: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1, "page must be >= 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "limit must be between 1 and 50")
    .max(50, "limit must be between 1 and 50")
    .default(10),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
