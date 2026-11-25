export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'NOT_FOUND'
  | 'EDITION_EXISTS'
  | 'INTERNAL';

interface ErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
    details?: Record<string, unknown>;
  };
}

/** A failed API request with the fields the UI needs to explain it. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode | 'UNKNOWN';
  readonly fields?: Record<string, string>;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode | 'UNKNOWN',
    message: string,
    options: { fields?: Record<string, string>; details?: Record<string, unknown> } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = options.fields;
    this.details = options.details;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ErrorBody>;
    if (body.error?.message) {
      return new ApiError(response.status, body.error.code ?? 'UNKNOWN', body.error.message, {
        fields: body.error.fields,
        details: body.error.details,
      });
    }
  } catch {
    // The body is not JSON: fall back to a status-based message below.
  }

  return new ApiError(
    response.status,
    'UNKNOWN',
    `Request failed with status ${response.status}`,
  );
}

/** The only place the app calls `fetch` for JSON. */
export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return (await response.json()) as T;
}
