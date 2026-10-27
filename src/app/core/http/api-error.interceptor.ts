import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ProblemDetail } from '../../shared/models/problem-detail';
import { ApiProblemError } from './api-error';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fieldErrors(value: unknown): Record<string, string[]> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(value)) {
    if (Array.isArray(messages) && messages.every((message: unknown) => typeof message === 'string')) {
      result[field] = messages;
    }
  }
  return result;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const body: unknown = error.error;
      const payload = isRecord(body) ? body : {};
      const problem: ProblemDetail = {
        title: typeof payload['title'] === 'string' ? payload['title'] : 'No se pudo completar la solicitud',
        status: error.status,
        detail: typeof payload['detail'] === 'string'
          ? payload['detail']
          : error.status === 0
            ? 'No se pudo conectar con el servidor. Intentá nuevamente.'
            : 'No se pudo completar la solicitud. Intentá nuevamente.',
      };
      if (typeof payload['code'] === 'string') problem.code = payload['code'];
      const errors = fieldErrors(payload['errors']);
      if (errors) problem.errors = errors;
      return throwError(() => new ApiProblemError(problem));
    }),
  );
