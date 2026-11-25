import type { ErrorRequestHandler, RequestHandler } from 'express';

export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'EDITION_EXISTS'
  | 'INTERNAL';

interface ApiErrorOptions {
  fields?: Record<string, string>;
  details?: Record<string, unknown>;
}

/** An expected failure that maps to the documented JSON error body. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;
  readonly details?: Record<string, unknown>;

  constructor(status: number, code: ErrorCode, message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = options.fields;
    this.details = options.details;
  }
}

/** Answers unknown `/api` routes with the same JSON error shape as every other failure. */
export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  // Unexpected failures are logged here and never reach the client.
  console.error(error);
  response.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
};
