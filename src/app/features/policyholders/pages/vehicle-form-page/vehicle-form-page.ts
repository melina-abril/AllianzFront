import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap, tap } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { PageHeader } from '../../../../shared/components/page-header';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { PolicyholderResponse, VehicleRequest } from '../../models/policyholders.models';

type Field = keyof VehicleRequest;
@Component({ selector: 'app-vehicle-form-page', imports: [ReactiveFormsModule, RouterLink, ErrorAlert, LoadingState, PageHeader], templateUrl: './vehicle-form-page.html', styleUrl: './vehicle-form-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class VehicleFormPage {
  readonly id = input.required<string>();
  readonly vehicleId = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly isEdit = computed(() => !!this.vehicleId());
  protected readonly form = inject(NonNullableFormBuilder).group({
    plate: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 -]{6,12}$/)]],
    brand: ['', [Validators.required, Validators.maxLength(80)]],
    model: ['', [Validators.required, Validators.maxLength(80)]],
    year: [2024, [Validators.required, Validators.min(1900), Validators.max(2100)]],
    engineNumber: ['', Validators.required],
    chassisNumber: ['', Validators.required]
  });
  protected readonly loadState = toSignal(toObservable(this.id).pipe(switchMap(id => toLoadState(this.service.getPolicyholder(id))), tap(state => {
    if (state.status === 'ready' && this.vehicleId()) {
      const vehicle = state.data.vehicles.find(item => item.id === this.vehicleId());
      if (vehicle) this.form.reset({ plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model, year: vehicle.year, engineNumber: vehicle.engineNumber, chassisNumber: vehicle.chassisNumber });
    }
  })), { initialValue: { status: 'loading' } as LoadState<PolicyholderResponse> });
  protected readonly saving = signal(false);
  protected readonly submitError = signal<string | null>(null);
  private readonly serverErrors = signal<Record<string, string[]>>({});
  constructor() { this.form.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.serverErrors.set({})); }
  protected errorFor(field: Field): string {
    const server = this.serverErrors()[field]?.[0];
    if (server) return server;
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('pattern')) return 'Ingresá una patente válida.';
    if (control.hasError('min') || control.hasError('max')) return 'Ingresá un año entre 1900 y 2100.';
    return 'El texto es demasiado largo.';
  }
  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const request: VehicleRequest = this.form.getRawValue();
    const vehicleId = this.vehicleId();
    this.saving.set(true); this.submitError.set(null);
    (vehicleId ? this.service.updateVehicle(this.id(), vehicleId, request) : this.service.addVehicle(this.id(), request)).subscribe({
      next: () => void this.router.navigate(vehicleId ? ['../../../..'] : ['../..'], { relativeTo: this.route }),
      error: (error: unknown) => { this.saving.set(false); this.submitError.set(errorMessage(error)); if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors); this.form.markAllAsTouched(); }
    });
  }
}
