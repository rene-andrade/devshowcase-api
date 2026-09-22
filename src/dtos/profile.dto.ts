import { z } from "zod";

export const createProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  bio: z.string().trim().optional(),
  githubUrl: z
    .string()
    .trim()
    .url("Invalid URL format")
    .regex(
      /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/?.*$/,
      "Must be a valid GitHub URL (e.g., https://github.com/username)"
    ),
  email: z.string().trim().email("Invalid email format"),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
