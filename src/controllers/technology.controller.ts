import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createTechnologySchema } from "../dtos/technology.dto";

export const createTechnology = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = createTechnologySchema.parse(req.body);

    const existingTechnology = await prisma.technology.findUnique({
      where: { name: validatedData.name },
    });

    if (existingTechnology) {
      res.status(409).json({
        error: "Conflict",
        message: `Technology '${validatedData.name}' already exists`,
      });
      return;
    }

    const technology = await prisma.technology.create({
      data: validatedData,
    });

    res.status(201).json(technology);
  } catch (error) {
    next(error);
  }
};

export const listTechnologies = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const technologies = await prisma.technology.findMany({
      orderBy: { name: "asc" },
    });

    res.status(200).json(technologies);
  } catch (error) {
    next(error);
  }
};
