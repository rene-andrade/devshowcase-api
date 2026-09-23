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
