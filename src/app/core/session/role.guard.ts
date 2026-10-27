import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { CurrentUser } from './current-user';

export function roleGuard(...roles: string[]): CanMatchFn {
  return () => inject(CurrentUser).hasRole(roles);
}
