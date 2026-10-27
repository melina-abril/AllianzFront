import { Observable, catchError, map, of, startWith } from 'rxjs';
import { errorMessage } from '../../core/http/api-error';
import { LoadState } from '../models/load-state';

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && 'items' in value && Array.isArray(value.items)) {
    return value.items.length === 0;
  }
  return false;
}

export function toLoadState<T>(source$: Observable<T>): Observable<LoadState<T>> {
  return source$.pipe(
    map((data): LoadState<T> => isEmpty(data) ? { status: 'empty' } : { status: 'ready', data }),
    catchError((error: unknown): Observable<LoadState<T>> =>
      of({ status: 'error', message: errorMessage(error) })),
    startWith({ status: 'loading' } as LoadState<T>),
  );
}
