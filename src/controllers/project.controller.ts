import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createProjectSchema } from "../dtos/project.dto";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const { title, description, repository, profileId, technologyIds } = validatedData;

    // Verificar se o perfil existe
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      res.status(404).json({
        error: "Not Found",
        message: `Profile with ID '${profileId}' was not found`,
      });
      return;
    }

    // Se houver technologies, validar se todas existem
    if (technologyIds && technologyIds.length > 0) {
      const existingTechnologies = await prisma.technology.findMany({
        where: {
          id: { in: technologyIds },
        },
      });

      if (existingTechnologies.length !== technologyIds.length) {
        const foundIds = new Set(existingTechnologies.map((t) => t.id));
        const missingIds = technologyIds.filter((id) => !foundIds.has(id));
        res.status(400).json({
          error: "Bad Request",
          message: `The following technology IDs do not exist: ${missingIds.join(", ")}`,
        });
        return;
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        repository,
        profileId,
        technologies: technologyIds && technologyIds.length > 0
          ? {
              connect: technologyIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        profile: true,
        technologies: true,
        feedbacks: true,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        technologies: true,
        feedbacks: true,
      },
    });

    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};
