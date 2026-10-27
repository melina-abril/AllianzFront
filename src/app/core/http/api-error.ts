import { ProblemDetail } from '../../shared/models/problem-detail';

export class ApiProblemError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(readonly problem: ProblemDetail) {
    super(problem.detail);
    this.name = 'ApiProblemError';
    this.status = problem.status;
    this.fieldErrors = problem.errors ?? {};
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiProblemError) {
    return error.problem.detail || error.problem.title;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intentá nuevamente.';
}
