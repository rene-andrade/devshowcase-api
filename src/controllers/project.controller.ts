import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { createProjectSchema, listProjectsQuerySchema } from "../dtos/project.dto";
import { createFeedbackSchema } from "../dtos/feedback.dto";
import { BadRequestError, NotFoundError } from "../errors/app-error";
import { parseIdParam } from "../utils/params";

const projectInclude = {
  profile: true,
  technologies: true,
  feedbacks: true,
} satisfies Prisma.ProjectInclude;

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, repository, profileId, technologyIds } =
      createProjectSchema.parse(req.body);

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundError(`Profile with ID '${profileId}' was not found`);
    }

    if (technologyIds.length > 0) {
      const existingTechnologies = await prisma.technology.findMany({
        where: { id: { in: technologyIds } },
      });

      if (existingTechnologies.length !== technologyIds.length) {
        const foundIds = new Set(existingTechnologies.map((t) => t.id));
        const missingIds = technologyIds.filter((id) => !foundIds.has(id));
        throw new BadRequestError(
          `The following technology IDs do not exist: ${missingIds.join(", ")}`
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        repository,
        profileId,
        technologies:
          technologyIds.length > 0
            ? { connect: technologyIds.map((id) => ({ id })) }
            : undefined,
      },
      include: projectInclude,
    });

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { technology, page, limit } = listProjectsQuerySchema.parse(req.query);

    const where: Prisma.ProjectWhereInput = technology
      ? { technologies: { some: { name: { equals: technology, mode: "insensitive" } } } }
      : {};

    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: projectInclude,
      }),
      prisma.project.count({ where }),
    ]);

    res.status(200).json({
      data: projects,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projectId = parseIdParam(req.params.id);
    const data = createFeedbackSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (!project) {
        throw new NotFoundError(`Project with ID '${projectId}' was not found`);
      }

      const feedback = await tx.feedback.create({ data: { ...data, projectId } });

      const stats = await tx.feedback.aggregate({
        where: { projectId },
        _avg: { rating: true },
        _count: { _all: true },
      });

      const averageRating = Math.round((stats._avg.rating ?? 0) * 100) / 100;

      await tx.project.update({
        where: { id: projectId },
        data: { averageRating },
      });

      return {
        feedback,
        project: {
          id: projectId,
          averageRating,
          feedbackCount: stats._count._all,
        },
      };
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const upvoteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);

    const project = await prisma.project.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
      select: { id: true, upvotes: true },
    });

    res.status(200).json(project);
  } catch (error) {
    next(error);
  }
};
