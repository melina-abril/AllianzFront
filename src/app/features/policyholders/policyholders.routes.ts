import { Routes } from '@angular/router';
import { roleGuard } from '../../core/session/role.guard';

export const POLICYHOLDERS_ROUTES: Routes = [
  { path: '', title: 'Asegurados y vehículos', loadComponent: () => import('./pages/policyholders-page/policyholders-page').then(m => m.PolicyholdersPage) },
  { path: 'new', title: 'Nuevo asegurado', canMatch: [roleGuard('producer', 'operator', 'supervisor')], loadComponent: () => import('./pages/policyholder-form-page/policyholder-form-page').then(m => m.PolicyholderFormPage) },
  { path: ':id/edit', title: 'Editar asegurado', canMatch: [roleGuard('producer', 'operator', 'supervisor')], loadComponent: () => import('./pages/policyholder-form-page/policyholder-form-page').then(m => m.PolicyholderFormPage) },
  { path: ':id/vehicles/new', title: 'Agregar vehículo', canMatch: [roleGuard('producer', 'operator', 'supervisor')], loadComponent: () => import('./pages/vehicle-form-page/vehicle-form-page').then(m => m.VehicleFormPage) },
  { path: ':id/vehicles/:vehicleId/edit', title: 'Editar vehículo', canMatch: [roleGuard('producer', 'operator', 'supervisor')], loadComponent: () => import('./pages/vehicle-form-page/vehicle-form-page').then(m => m.VehicleFormPage) },
  { path: ':id/deactivate', title: 'Dar de baja', canMatch: [roleGuard('producer', 'operator', 'supervisor')], loadComponent: () => import('./pages/policyholder-deactivate-page/policyholder-deactivate-page').then(m => m.PolicyholderDeactivatePage) }
];
