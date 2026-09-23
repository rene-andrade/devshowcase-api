import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, ErrorDetail } from "../errors/app-error";

const send = (
  req: Request,
  res: Response,
  statusCode: number,
  error: string,
  message: string,
  details?: ErrorDetail[]
): void => {
  res.status(statusCode).json({
    statusCode,
    error,
    message,
    ...(details && details.length > 0 ? { details } : {}),
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  send(req, res, 404, "Not Found", `Route ${req.method} ${req.path} not found`);
};

export const errorHandler = (
  err: Error & { type?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    send(req, res, err.statusCode, err.error, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    send(
      req,
      res,
      400,
      "Bad Request",
      "Validation failed",
      err.issues.flatMap((issue) =>
        issue.code === "unrecognized_keys"
          ? issue.keys.map((key) => ({
              field: [...issue.path, key].join("."),
              message: `Unknown parameter '${key}'`,
            }))
          : [{ field: issue.path.join(".") || "(root)", message: issue.message }]
      )
    );
    return;
  }

  if (err.type === "entity.parse.failed") {
    send(req, res, 400, "Bad Request", "Malformed JSON in request body");
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "unknown";
        send(req, res, 409, "Conflict", `Unique constraint failed on field(s): ${target}`);
        return;
      }
      case "P2025":
        send(req, res, 404, "Not Found", "Resource not found");
        return;
      case "P2003":
        send(req, res, 400, "Bad Request", "Referenced resource does not exist");
        return;
      case "P2023":
        send(req, res, 400, "Bad Request", "Invalid identifier format");
        return;
    }
  }

  console.error("Unhandled Application Error:", err);

  send(
    req,
    res,
    500,
    "Internal Server Error",
    process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
  );
};
