import { Injectable, signal } from '@angular/core';

export interface SessionUser {
  name: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  insured: 'Asegurado',
  producer: 'Productor asesor',
  operator: 'Operador de emisión',
  adjuster: 'Liquidador de siniestros',
  supervisor: 'Supervisor',
};

@Injectable({ providedIn: 'root' })
export class CurrentUser {
  private readonly current = signal<SessionUser>({ name: 'Usuario de prueba', role: 'insured' });
  readonly user = this.current.asReadonly();

  roleLabel(): string {
    return ROLE_LABELS[this.user().role] ?? this.user().role;
  }

  hasRole(roles?: readonly string[]): boolean {
    return !roles?.length || roles.includes(this.user().role);
  }

  setRole(value: string): void {
    this.current.update(user => ({ ...user, role: value }));
  }
}
