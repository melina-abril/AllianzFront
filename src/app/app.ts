import { Component, computed, inject } from '@angular/core';
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
})
export class App {
  protected readonly currentUser = inject(CurrentUser);
  protected readonly roles = [
    { value: 'insured', label: 'Asegurado' },
    { value: 'producer', label: 'Productor asesor' },
    { value: 'operator', label: 'Operador de emisión' },
    { value: 'adjuster', label: 'Liquidador de siniestros' },
    { value: 'supervisor', label: 'Supervisor' },
  ];
  private readonly navigation: readonly NavigationItem[] = [
    { label: 'Cotizador de seguro de auto', path: '/quotes' },
    {
      label: 'Asegurados y vehículos',
      path: '/policyholders',
      roles: ['producer', 'operator', 'supervisor'],
    },
  ];
  protected readonly visibleNavigation = computed(() =>
    this.navigation.filter(item => this.currentUser.hasRole(item.roles)),
  );
}
