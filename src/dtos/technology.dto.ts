import { z } from "zod";

export const createTechnologySchema = z.object({
  name: z.string().trim().min(1, "Technology name is required"),
});

export type CreateTechnologyInput = z.infer<typeof createTechnologySchema>;
