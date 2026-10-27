import { Routes } from '@angular/router';

export const QUOTES_ROUTES: Routes = [
  { path: '', title: 'Cotizador de seguro de auto', loadComponent: () => import('./pages/quote-page/quote-page').then(m => m.QuotePage) }
];
