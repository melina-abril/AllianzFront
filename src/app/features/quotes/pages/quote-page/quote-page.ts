import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { EmptyState } from '../../../../shared/components/empty-state';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { Page } from '../../../../shared/models/page';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { QuotesService } from '../../data-access/quotes.service';
import { PaymentMethod, QuoteRequest, QuoteResponse, VehicleResponse, VehicleUse } from '../../models/quotes.models';

@Component({
  selector: 'app-quote-page',
  imports: [ReactiveFormsModule, DatePipe, MoneyPipe, LoadingState, EmptyState, ErrorAlert],
  templateUrl: './quote-page.html',
  styleUrl: './quote-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotePage {
  private readonly service = inject(QuotesService);
  private readonly builder = inject(NonNullableFormBuilder);

  protected readonly form = this.builder.group({
    brand: ['', Validators.required], model: ['', Validators.required], version: ['', Validators.required],
    year: [0, [Validators.required, Validators.min(1900)]],
    use: ['PRIVATE' as VehicleUse, Validators.required], gnc: [false],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    birthDate: ['', Validators.required],
    registrationYears: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    claimsLastThreeYears: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    paymentMethod: ['AUTOMATIC_DEBIT' as PaymentMethod, Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });
  protected readonly recoveryForm = this.builder.group({
    number: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
  });
  protected readonly catalogState = toSignal(
    toLoadState(this.service.listQuotableVehicles({ page: 0, size: 100 })),
    { initialValue: { status: 'loading' } as LoadState<Page<VehicleResponse>> },
  );
  protected readonly quote = signal<QuoteResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly recovering = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly recoveryError = signal<string | null>(null);
  private readonly serverErrors = signal<Record<string, string[]>>({});

  protected brands(vehicles: VehicleResponse[]): string[] {
    return [...new Set(vehicles.map(vehicle => vehicle.brand))];
  }

  protected models(vehicles: VehicleResponse[]): string[] {
    return [...new Set(vehicles.filter(vehicle => vehicle.brand === this.form.controls.brand.value).map(vehicle => vehicle.model))];
  }

  protected versions(vehicles: VehicleResponse[]): string[] {
    return [...new Set(vehicles.filter(vehicle => vehicle.brand === this.form.controls.brand.value &&
      vehicle.model === this.form.controls.model.value).map(vehicle => vehicle.version))];
  }

  protected years(vehicles: VehicleResponse[]): number[] {
    return vehicles.filter(vehicle => vehicle.brand === this.form.controls.brand.value &&
      vehicle.model === this.form.controls.model.value && vehicle.version === this.form.controls.version.value &&
      vehicle.year <= new Date().getFullYear()).map(vehicle => vehicle.year);
  }

  protected brandChanged(): void {
    this.form.patchValue({ model: '', version: '', year: 0 });
  }

  protected modelChanged(): void {
    this.form.patchValue({ version: '', year: 0 });
  }

  protected versionChanged(): void {
    this.form.patchValue({ year: 0 });
  }

  protected errorFor(field: keyof QuoteRequest): string {
    const server = this.serverErrors()[field]?.[0];
    if (server) return server;
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.hasError('required')) return 'Este dato es obligatorio.';
    if (field === 'postalCode') return 'Ingresá cuatro dígitos.';
    if (field === 'dni') return 'Ingresá siete u ocho dígitos.';
    return 'Revisá este dato.';
  }

  protected recoveryErrorFor(field: 'number' | 'dni'): string {
    const control = this.recoveryForm.controls[field];
    if (!control.touched || !control.errors) return '';
    return control.hasError('required') ? 'Este dato es obligatorio.' : 'Ingresá siete u ocho dígitos.';
  }

  protected save(vehicles: VehicleResponse[]): void {
    this.serverErrors.set({});
    const value = this.form.getRawValue();
    const birth = new Date(`${value.birthDate}T00:00:00`);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear() -
      (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) ? 1 : 0);
    if (this.form.invalid || !value.birthDate || Number.isNaN(birth.getTime()) ||
      birth.toISOString().slice(0, 10) !== value.birthDate || birth >= today ||
      !Number.isInteger(value.registrationYears) || !Number.isInteger(value.claimsLastThreeYears) ||
      value.registrationYears > age) {
      this.form.markAllAsTouched();
      this.saveError.set('Revisá los datos indicados para cotizar');
      return;
    }
    if (!vehicles.some(vehicle => vehicle.brand === value.brand && vehicle.model === value.model &&
      vehicle.version === value.version && vehicle.year === Number(value.year))) {
      this.saveError.set('No hay vehículos disponibles para esta selección');
      return;
    }
    const request: QuoteRequest = { ...value, year: Number(value.year),
      registrationYears: Number(value.registrationYears), claimsLastThreeYears: Number(value.claimsLastThreeYears) };
    this.saving.set(true);
    this.saveError.set(null);
    const current = this.quote();
    (current ? this.service.updateQuote(current.id, request) : this.service.createQuote(request)).subscribe({
      next: result => { this.quote.set(result); this.saving.set(false); },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors);
        this.saveError.set(error instanceof ApiProblemError && Object.keys(error.fieldErrors).length
          ? 'Revisá los datos indicados para cotizar'
          : 'No pudimos actualizar la cotización. Intentá nuevamente');
      },
    });
  }

  protected recover(): void {
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }
    const { number, dni } = this.recoveryForm.getRawValue();
    this.recovering.set(true);
    this.recoveryError.set(null);
    this.service.retrieveQuote(number.trim(), dni.trim()).subscribe({
      next: result => {
        this.quote.set(result);
        this.form.reset({ brand: result.vehicle.brand, model: result.vehicle.model,
          version: result.vehicle.version, year: result.vehicle.year, use: result.use, gnc: result.gnc,
          postalCode: result.postalCode, birthDate: result.birthDate,
          registrationYears: result.registrationYears, claimsLastThreeYears: result.claimsLastThreeYears,
          paymentMethod: result.paymentMethod, dni: result.dni });
        this.saveError.set(null);
        this.serverErrors.set({});
        this.recovering.set(false);
      },
      error: (error: unknown) => {
        this.quote.set(null);
        this.recovering.set(false);
        this.recoveryError.set(error instanceof ApiProblemError && (error.status === 404 || error.status === 422)
          ? errorMessage(error) : 'No pudimos recuperar la cotización. Intentá nuevamente');
      },
    });
  }
}
