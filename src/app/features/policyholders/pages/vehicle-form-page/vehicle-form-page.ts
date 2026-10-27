import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { Vehicle, VehicleRequest } from '../../models/policyholders.models';

@Component({ selector: 'app-vehicle-form-page', imports: [ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState], templateUrl: './vehicle-form-page.html', styleUrl: './vehicle-form-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class VehicleFormPage {
  readonly id = input.required<string>();
  readonly vehicleId = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly router = inject(Router);
  protected readonly isEdit = computed(() => Boolean(this.vehicleId()));
  protected readonly form = inject(NonNullableFormBuilder).group({
    plate: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]{6,12}$/)]],
    brand: ['', [Validators.required, Validators.maxLength(80)]],
    model: ['', [Validators.required, Validators.maxLength(80)]],
    year: [2023, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    engineNumber: ['', Validators.required], chassisNumber: ['', Validators.required],
  });
  private readonly request = computed(() => ({ id: this.id(), vehicleId: this.vehicleId() }));
  protected readonly loadState = toSignal(toObservable(this.request).pipe(switchMap(({ id, vehicleId }): Observable<LoadState<Vehicle | null>> => vehicleId ? toLoadState(this.service.getPolicyholder(id).pipe(switchMap(holder => { const vehicle = holder.vehicles.find(item => item.id === vehicleId); return vehicle ? of(vehicle) : this.notFound(); }))) : of({ status: 'ready', data: null })), tap(state => { if (state.status === 'ready' && state.data) { const { plate, brand, model, year, engineNumber, chassisNumber } = state.data; this.form.reset({ plate, brand, model, year, engineNumber, chassisNumber }); } })), { initialValue: { status: 'loading' } as LoadState<Vehicle | null> });
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private readonly serverErrors = signal<Record<string, string[]>>({});
  constructor() { this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.serverErrors.set({})); }
  private notFound(): Observable<Vehicle> { return import('../../../../core/http/mock-response').then ? of({ id: '', plate: '', brand: '', model: '', year: 1900, engineNumber: '', chassisNumber: '', covered: false }) : of({ id: '', plate: '', brand: '', model: '', year: 1900, engineNumber: '', chassisNumber: '', covered: false }); }
  protected errorFor(field: keyof VehicleRequest): string { const server = this.serverErrors()[field]?.[0]; if (server) return server; const control = this.form.controls[field]; if (!control.touched || control.valid || !control.errors) return ''; return control.hasError('required') ? 'Este campo es obligatorio.' : 'Revisá el valor ingresado.'; }
  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const request: VehicleRequest = this.form.getRawValue(); const vehicleId = this.vehicleId(); this.saving.set(true); this.submitError.set(null);
    (vehicleId ? this.service.updateVehicle(this.id(), vehicleId, request) : this.service.addVehicle(this.id(), request)).subscribe({
      next: () => void this.router.navigate(['/policyholders', this.id()]),
      error: (error: unknown) => { this.saving.set(false); this.submitError.set(errorMessage(error)); if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors); this.form.markAllAsTouched(); },
    });
  }
}
