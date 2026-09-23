import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { createTechnologySchema } from "../dtos/technology.dto";
import { ConflictError } from "../errors/app-error";

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
      throw new ConflictError(`Technology '${validatedData.name}' already exists`);
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
