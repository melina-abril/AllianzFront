import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'quotes' },
  {
    path: 'quotes',
    loadChildren: () => import('./features/quotes/quotes.routes').then(module => module.QUOTES_ROUTES),
  },
  {
    path: 'policyholders',
    loadChildren: () => import('./features/policyholders/policyholders.routes').then(module => module.POLICYHOLDERS_ROUTES),
  },
  { path: '**', redirectTo: 'quotes' },
];
