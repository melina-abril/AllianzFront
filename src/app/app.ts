import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CurrentUser } from './core/session/current-user';

interface NavigationItem {
  label: string;
  path: string;
  roles?: readonly string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly currentUser = inject(CurrentUser);

  protected readonly roles: readonly { value: string; label: string }[] = [
    { value: 'insured', label: 'Asegurado' },
    { value: 'producer', label: 'Productor asesor' },
    { value: 'operator', label: 'Operador de emisión' },
    { value: 'adjuster', label: 'Liquidador de siniestros' },
    { value: 'supervisor', label: 'Supervisor' },
  ];

  protected readonly navigation: readonly NavigationItem[] = [
    { label: 'Cotizador de seguro de auto', path: '/quotes' },
    {
      label: 'Asegurados y vehículos',
      path: '/policyholders',
      roles: ['producer', 'operator', 'supervisor'],
    },
  ];

  protected onRoleChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.currentUser.setRole(target.value);
    }
  }
}
