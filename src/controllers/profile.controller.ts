import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createProfileSchema } from "../dtos/profile.dto";

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
      res.status(409).json({
        error: "Conflict",
        message: "A profile with this email already exists",
      });
      return;
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
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({ error: "Bad Request", message: "Profile ID is required" });
      return;
    }

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
      res.status(404).json({
        error: "Not Found",
        message: `Profile with ID '${id}' was not found`,
      });
      return;
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};
