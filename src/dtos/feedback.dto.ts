import { z } from "zod";

export const createFeedbackSchema = z.object({
  author: z.string().trim().min(1, "Author is required"),
  comment: z.string().trim().min(1, "Comment is required"),
  rating: z
    .number("Rating must be a number")
    .int("Rating must be an integer")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
