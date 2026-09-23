import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createProfileSchema } from "../dtos/profile.dto";
import { ConflictError, NotFoundError } from "../errors/app-error";
import { parseUuidParam } from "../utils/params";

export const createProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createProfileSchema.parse(req.body);

    const existingProfile = await prisma.profile.findUnique({
      where: { email: validatedData.email },
    });

    if (existingProfile) {
      throw new ConflictError("A profile with this email already exists");
    }

    const profile = await prisma.profile.create({
      data: validatedData,
    });

    res.status(201).json(profile);
  } catch (error) {
    next(error);
  }
};

export const getProfileById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseUuidParam(req.params.id);

    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            technologies: true,
            feedbacks: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError(`Profile with ID '${id}' was not found`);
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
