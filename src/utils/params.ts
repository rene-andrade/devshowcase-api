import { z } from "zod";
import { BadRequestError } from "../errors/app-error";

const intIdSchema = z.coerce.number().int().positive();

export const parseIdParam = (value: unknown, name = "id"): number => {
  const result = intIdSchema.safeParse(value);
  if (!result.success) {
    throw new BadRequestError(`Parameter '${name}' must be a positive integer`);
  }
  return result.data;
};

export const parseUuidParam = (value: unknown, name = "id"): string => {
  const result = z.uuid().safeParse(value);
  if (!result.success) {
    throw new BadRequestError(`Parameter '${name}' must be a valid UUID`);
  }
  return result.data;
};
