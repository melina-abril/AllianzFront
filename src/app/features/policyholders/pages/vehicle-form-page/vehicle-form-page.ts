import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { PageHeader } from '../../../../shared/components/page-header';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { VehicleRequest, VehicleResponse } from '../../models/policyholders.models';

type Field = keyof VehicleRequest;
@Component({
  selector: 'app-vehicle-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './vehicle-form-page.html',
  styleUrl: './vehicle-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VehicleFormPage {
  readonly id = input.required<string>();
  readonly vehicleId = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly router = inject(Router);
  protected readonly isEdit = computed(() => !!this.vehicleId());
  protected readonly form = inject(NonNullableFormBuilder).group({
    plate: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]+$/)]],
    brand: ['', [Validators.required, Validators.maxLength(80)]],
    model: ['', [Validators.required, Validators.maxLength(80)]],
    year: [2024, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    engine: ['', [Validators.required, Validators.maxLength(80)]],
    chassis: ['', [Validators.required, Validators.maxLength(80)]]
  });
  private readonly request = computed(() => ({ id: this.id(), vehicleId: this.vehicleId() }));
  protected readonly loadState = toSignal(toObservable(this.request).pipe(switchMap(({ id, vehicleId }): Observable<LoadState<VehicleResponse | null>> =>
    vehicleId ? toLoadState(this.service.getPolicyholder(id).pipe(switchMap(holder => {
      const vehicle = holder.vehicles.find(item => item.id === vehicleId);
      return vehicle ? of(vehicle) : new Observable<VehicleResponse>(subscriber => subscriber.error(new Error('No se encontró el vehículo.')));
    }))) : of({ status: 'ready', data: null })
  ), tap(state => {
    if (state.status === 'ready' && state.data) {
      const { plate, brand, model, year, engine, chassis } = state.data;
      this.form.reset({ plate, brand, model, year, engine, chassis });
    }
  })), { initialValue: { status: 'loading' } as LoadState<VehicleResponse | null> });
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private readonly serverErrors = signal<Record<string, string[]>>({});
  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.serverErrors.set({}));
  }
  protected errorFor(field: Field): string {
    const server = this.serverErrors()[field]?.[0];
    if (server) return server;
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('min') || control.hasError('max')) return 'Ingresá un año entre 1900 y 2100.';
    if (control.hasError('pattern')) return 'Usá solo letras, números y separadores.';
    return 'Revisá este campo.';
  }
  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const request: VehicleRequest = { ...this.form.getRawValue(), year: Number(this.form.controls.year.value) };
    if (!Number.isInteger(request.year)) { this.form.controls.year.setErrors({ min: true }); this.form.controls.year.markAsTouched(); return; }
    const vehicleId = this.vehicleId();
    this.saving.set(true);
    this.submitError.set(null);
    (vehicleId ? this.service.updateVehicle(this.id(), vehicleId, request) : this.service.createVehicle(this.id(), request)).subscribe({
      next: () => void this.router.navigate(['/policyholders', this.id()]),
      error: (error: unknown) => { this.saving.set(false); this.submitError.set(errorMessage(error)); if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors); this.form.markAllAsTouched(); }
    });
  }
}
