import { DatePipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { switchMap } from 'rxjs';
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

const pastDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value;
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || value >= new Date().toISOString().slice(0, 10) ? { date: true } : null;
};
const wholeNonnegative: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  Number.isInteger(control.value) && control.value >= 0 ? null : { integer: true };

@Component({
  selector: 'app-quote-page',
  imports: [ReactiveFormsModule, DatePipe, PercentPipe, MoneyPipe, LoadingState, EmptyState, ErrorAlert],
  templateUrl: './quote-page.html',
  styleUrl: './quote-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotePage {
  private readonly service = inject(QuotesService);
  private readonly builder = inject(NonNullableFormBuilder);
  private readonly catalogReload = signal(0);
  protected readonly catalogState = toSignal(
    toObservable(this.catalogReload).pipe(switchMap(() => toLoadState(this.service.listQuotableVehicles({ page: 0, size: 1000 })))),
    { initialValue: { status: 'loading' } as LoadState<Page<VehicleResponse>> }
  );
  protected readonly vehicles = computed(() => {
    const state = this.catalogState();
    return state.status === 'ready' ? state.data.items : [];
  });
  protected readonly form = this.builder.group({
    brand: ['', Validators.required], model: ['', Validators.required], version: ['', Validators.required],
    year: [0, Validators.required], use: ['PRIVATE' as VehicleUse, Validators.required],
    gnc: [false], postalCode: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    birthDate: ['', [Validators.required, pastDate]], registrationYears: [0, [Validators.required, wholeNonnegative]],
    claimsLastThreeYears: [0, [Validators.required, wholeNonnegative]],
    paymentMethod: ['AUTOMATIC_DEBIT' as PaymentMethod, Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]]
  });
  protected readonly recoveryForm = this.builder.group({
    number: ['', Validators.required], dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]]
  });
  protected readonly quote = signal<QuoteResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly recovering = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly recoveryError = signal<string | null>(null);
  protected readonly attempted = signal(false);
  protected readonly recoveryAttempted = signal(false);
  protected readonly serverErrors = signal<Record<string, string[]>>({});

  protected unique(values: string[]): string[] { return [...new Set(values)]; }
  protected brands(): string[] { return this.unique(this.vehicles().map(v => v.brand)); }
  protected models(): string[] { return this.unique(this.vehicles().filter(v => v.brand === this.form.controls.brand.value).map(v => v.model)); }
  protected versions(): string[] { return this.unique(this.vehicles().filter(v => v.brand === this.form.controls.brand.value && v.model === this.form.controls.model.value).map(v => v.version)); }
  protected years(): number[] { return this.vehicles().filter(v => v.brand === this.form.controls.brand.value && v.model === this.form.controls.model.value && v.version === this.form.controls.version.value && v.year <= new Date().getFullYear()).map(v => v.year); }
  protected changeBrand(): void { this.form.patchValue({ model: '', version: '', year: 0 }); }
  protected changeModel(): void { this.form.patchValue({ version: '', year: 0 }); }
  protected changeVersion(): void { this.form.patchValue({ year: 0 }); }
  protected reloadCatalog(): void { this.catalogReload.update(n => n + 1); }

  protected errorFor(field: keyof QuoteRequest): string {
    const server = this.serverErrors()[field]?.[0];
    if (server) return server;
    const control = this.form.controls[field];
    if (!this.attempted() || !control.invalid) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('pattern')) return field === 'postalCode' ? 'Ingresá un código postal de cuatro dígitos.' : 'Ingresá un DNI de siete u ocho dígitos.';
    if (control.hasError('date')) return 'Ingresá una fecha de nacimiento real y anterior a hoy.';
    return 'Ingresá un número entero no negativo.';
  }
  protected recoveryFieldError(field: 'number' | 'dni'): string {
    const control = this.recoveryForm.controls[field];
    if (!this.recoveryAttempted() || !control.invalid) return '';
    return control.hasError('required') ? 'Este campo es obligatorio.' : 'Ingresá un DNI de siete u ocho dígitos.';
  }
  protected submit(): void {
    this.attempted.set(true);
    this.serverErrors.set({});
    this.saveError.set(null);
    const value = this.form.getRawValue();
    const birth = new Date(`${value.birthDate}T00:00:00`);
    const elapsed = Number.isNaN(birth.getTime()) ? -1 : new Date().getFullYear() - birth.getFullYear() - (new Date().getTime() < new Date(new Date().getFullYear(), birth.getMonth(), birth.getDate()).getTime() ? 1 : 0);
    if (value.registrationYears > elapsed) this.form.controls.registrationYears.setErrors({ age: true });
    if (!this.years().includes(Number(value.year)) || Number(value.year) > new Date().getFullYear()) this.form.controls.year.setErrors({ catalog: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError.set('Revisá los datos indicados para cotizar');
      return;
    }
    const request: QuoteRequest = { ...value, year: Number(value.year), registrationYears: Number(value.registrationYears), claimsLastThreeYears: Number(value.claimsLastThreeYears) };
    this.saving.set(true);
    const saved = this.quote();
    (saved ? this.service.updateQuote(saved.id, request) : this.service.createQuote(request)).subscribe({
      next: result => { this.quote.set(result); this.saving.set(false); this.attempted.set(false); },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors);
        this.saveError.set(error instanceof ApiProblemError && error.status === 422 && error.problem.detail === 'No hay vehículos disponibles para esta selección' ? error.problem.detail : 'No pudimos actualizar la cotización. Intentá nuevamente');
      }
    });
  }
  protected recover(): void {
    this.recoveryAttempted.set(true);
    this.recoveryError.set(null);
    if (this.recoveryForm.invalid) { this.recoveryForm.markAllAsTouched(); return; }
    const { number, dni } = this.recoveryForm.getRawValue();
    this.recovering.set(true);
    this.quote.set(null);
    this.service.retrieveQuote(number.trim(), dni.trim()).subscribe({
      next: result => {
        this.recovering.set(false);
        this.quote.set(result);
        this.form.reset({ brand: result.vehicle.brand, model: result.vehicle.model, version: result.vehicle.version, year: result.vehicle.year, use: result.use, gnc: result.gnc, postalCode: result.postalCode, birthDate: result.birthDate, registrationYears: result.registrationYears, claimsLastThreeYears: result.claimsLastThreeYears, paymentMethod: result.paymentMethod, dni: result.dni });
        this.attempted.set(false);
      },
      error: (error: unknown) => {
        this.recovering.set(false);
        this.recoveryError.set(error instanceof ApiProblemError && error.status === 422 ? 'La cotización venció. Realizá una nueva cotización' : error instanceof ApiProblemError && error.status === 404 ? 'No encontramos una cotización con esos datos' : errorMessage(error));
      }
    });
  }
}
