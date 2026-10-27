import { Observable, delay, of, throwError } from 'rxjs';
import { ApiProblemError } from './api-error';

export function mockResponse<T>(data: T): Observable<T> {
  // Respuesta simulada; se reemplaza al conectar el backend.
  return of(data).pipe(delay(250));
}

export function mockError(
  status: number,
  detail: string,
  errors?: Record<string, string[]>,
): Observable<never> {
  return throwError(() => new ApiProblemError({
    title: 'No se pudo completar la solicitud',
    status,
    detail,
    ...(errors ? { errors } : {}),
  }));
}
