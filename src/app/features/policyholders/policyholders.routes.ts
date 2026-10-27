import { Routes } from '@angular/router';

export const POLICYHOLDERS_ROUTES: Routes = [
  { path: '', title: 'Asegurados y vehículos', loadComponent: () => import('./pages/policyholders-page/policyholders-page').then(m => m.PolicyholdersPage) },
  { path: 'new', title: 'Nuevo asegurado', loadComponent: () => import('./pages/policyholder-form-page/policyholder-form-page').then(m => m.PolicyholderFormPage) },
  { path: ':id/vehicles/new', title: 'Agregar vehículo', loadComponent: () => import('./pages/vehicle-form-page/vehicle-form-page').then(m => m.VehicleFormPage) },
  { path: ':id/vehicles/:vehicleId/edit', title: 'Editar vehículo', loadComponent: () => import('./pages/vehicle-form-page/vehicle-form-page').then(m => m.VehicleFormPage) },
  { path: ':id/edit', title: 'Editar asegurado', loadComponent: () => import('./pages/policyholder-form-page/policyholder-form-page').then(m => m.PolicyholderFormPage) },
  { path: ':id', title: 'Ficha del asegurado', loadComponent: () => import('./pages/policyholders-page/policyholders-page').then(m => m.PolicyholdersPage) }
];
