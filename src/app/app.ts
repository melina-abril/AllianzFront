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
  protected readonly navigation: readonly NavigationItem[] = [
    { label: 'Cotizador de seguro de auto', path: '/quotes' },
    {
      label: 'Asegurados y vehículos',
      path: '/policyholders',
      roles: ['producer', 'operator', 'adjuster', 'supervisor'],
    },
  ];

  protected changeRole(role: string): void {
    this.currentUser.setRole(role);
  }
}
