export interface ErrorDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    message: string,
    public readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: ErrorDetail[]) {
    super(400, "Bad Request", message, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, "Not Found", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "Conflict", message);
  }
}
