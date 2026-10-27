import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, startWith } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { PageHeader } from '../../../../shared/components/page-header';
import { LoadState } from '../../../../shared/models/load-state';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { QuotesService } from '../../data-access/quotes.service';
import { COVERAGE_LABELS, DISCOUNT_LABELS, PaymentMethod, QuoteRequest, QuoteResponse, VehicleCatalogResponse, VehicleOptionResponse, VehicleUse } from '../../models/quotes.models';

type QuoteField = keyof QuoteRequest;

@Component({
  selector: 'app-quote-page',
  imports: [ReactiveFormsModule, DatePipe, MoneyPipe, PageHeader],
  templateUrl: './quote-page.html',
  styleUrl: './quote-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuotePage {
  private readonly service = inject(QuotesService);
  private readonly builder = inject(NonNullableFormBuilder);
  protected readonly coverageLabels = COVERAGE_LABELS;
  protected readonly discountLabels = DISCOUNT_LABELS;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly form = this.builder.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    version: ['', Validators.required],
    year: [0, [Validators.required, Validators.min(1900), Validators.max(this.currentYear)]],
    use: ['PERSONAL' as VehicleUse, Validators.required],
    gnc: [false],
    postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{4}$/)]],
    birthDate: ['', Validators.required],
    licenseYears: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
    claimsLastThreeYears: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
    paymentMethod: ['AUTO_DEBIT' as PaymentMethod, Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
  });
  protected readonly recoveryForm = this.builder.group({
    number: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,8}$/)]],
  });
  private readonly selection = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });
  private readonly catalogRefresh = signal(0);
  protected readonly catalogState = toSignal(
    toObservable(this.catalogRefresh).pipe(switchMap(() => toLoadState(this.service.getVehicleCatalog()))),
    { initialValue: { status: 'loading' } as LoadState<VehicleCatalogResponse> },
  );
  protected readonly quote = signal<QuoteResponse | null>(null);
  protected readonly saving = signal(false);
  protected readonly recovering = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly recoveryError = signal<string | null>(null);
  protected readonly formMessage = signal<string | null>(null);
  private readonly serverErrors = signal<Record<string, string[]>>({});

  protected readonly availableVehicles = computed(() => {
    const state = this.catalogState();
    return state.status === 'ready' ? state.data.vehicles.filter(vehicle => vehicle.year <= this.currentYear) : [];
  });
  protected readonly brands = computed(() => [...new Set(this.availableVehicles().map(vehicle => vehicle.brand))]);
  protected readonly models = computed(() => {
    const brand = this.selection().brand;
    return [...new Set(this.availableVehicles().filter(vehicle => vehicle.brand === brand).map(vehicle => vehicle.model))];
  });
  protected readonly versions = computed(() => {
    const selected = this.selection();
    return [...new Set(this.availableVehicles().filter(vehicle => vehicle.brand === selected.brand && vehicle.model === selected.model).map(vehicle => vehicle.version))];
  });
  protected readonly years = computed(() => {
    const selected = this.selection();
    return this.availableVehicles().filter(vehicle => vehicle.brand === selected.brand && vehicle.model === selected.model && vehicle.version === selected.version).map(vehicle => vehicle.year);
  });

  protected resetAfterBrand(): void {
    this.form.patchValue({ model: '', version: '', year: 0 });
  }
  protected resetAfterModel(): void {
    this.form.patchValue({ version: '', year: 0 });
  }
  protected resetAfterVersion(): void {
    this.form.patchValue({ year: 0 });
  }
  protected reloadCatalog(): void {
    this.catalogRefresh.update(value => value + 1);
  }

  protected errorFor(field: QuoteField): string {
    const server = this.serverErrors()[field]?.[0];
    if (server) return server;
    const control = this.form.controls[field];
    if (!control.touched || control.valid) return '';
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (field === 'postalCode') return 'Ingresá un código postal de cuatro dígitos.';
    if (field === 'dni') return 'Ingresá un DNI de siete u ocho dígitos.';
    return 'Ingresá un valor válido.';
  }

  protected recoveryErrorFor(field: 'number' | 'dni'): string {
    const control = this.recoveryForm.controls[field];
    if (!control.touched || control.valid) return '';
    return control.hasError('required') ? 'Este campo es obligatorio.' : 'Ingresá un DNI de siete u ocho dígitos.';
  }

  private validVehicle(value: QuoteRequest): boolean {
    return this.availableVehicles().some((vehicle: VehicleOptionResponse) => vehicle.brand === value.brand &&
      vehicle.model === value.model && vehicle.version === value.version && vehicle.year === value.year);
  }

  protected submit(): void {
    this.serverErrors.set({});
    this.saveError.set(null);
    this.formMessage.set(null);
    const value: QuoteRequest = this.form.getRawValue();
    const birth = new Date(`${value.birthDate}T00:00:00`);
    const birthValid = value.birthDate !== '' && Number.isFinite(birth.getTime()) &&
      birth.toISOString().slice(0, 10) === value.birthDate && birth < new Date();
    const age = birthValid ? (Date.now() - birth.getTime()) / 31557600000 : 0;
    const valid = this.form.valid && birthValid && Number.isInteger(value.licenseYears) &&
      value.licenseYears <= age && Number.isInteger(value.claimsLastThreeYears) && this.validVehicle(value);
    if (!valid) {
      this.form.markAllAsTouched();
      const errors: Record<string, string[]> = {};
      if (!birthValid) errors['birthDate'] = ['Ingresá una fecha real anterior a hoy.'];
      if (value.licenseYears > age || !Number.isInteger(value.licenseYears)) errors['licenseYears'] = ['Los años de registro no pueden superar la edad y deben ser enteros.'];
      if (!Number.isInteger(value.claimsLastThreeYears)) errors['claimsLastThreeYears'] = ['Ingresá un número entero.'];
      if (!this.validVehicle(value)) errors['year'] = ['Seleccioná una combinación disponible del catálogo.'];
      this.serverErrors.set(errors);
      this.formMessage.set('Revisá los datos indicados para cotizar');
      return;
    }
    this.saving.set(true);
    const current = this.quote();
    const operation = current ? this.service.updateQuote(current.number, value) : this.service.createQuote(value);
    operation.subscribe({
      next: saved => {
        this.quote.set(saved);
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiProblemError && error.fieldErrors && Object.keys(error.fieldErrors).length) {
          this.serverErrors.set(error.fieldErrors);
          this.form.markAllAsTouched();
          this.formMessage.set('Revisá los datos indicados para cotizar');
        } else {
          this.saveError.set('No pudimos actualizar la cotización. Intentá nuevamente');
        }
      },
    });
  }

  protected recover(): void {
    this.recoveryError.set(null);
    if (this.recoveryForm.invalid) {
      this.recoveryForm.markAllAsTouched();
      return;
    }
    const { number, dni } = this.recoveryForm.getRawValue();
    this.quote.set(null);
    this.recovering.set(true);
    this.service.recoverQuote(number.trim(), dni).subscribe({
      next: recovered => {
        this.quote.set(recovered);
        this.form.reset({
          brand: recovered.brand, model: recovered.model, version: recovered.version, year: recovered.year,
          use: recovered.use, gnc: recovered.gnc, postalCode: recovered.postalCode,
          birthDate: recovered.birthDate, licenseYears: recovered.licenseYears,
          claimsLastThreeYears: recovered.claimsLastThreeYears, paymentMethod: recovered.paymentMethod,
          dni: recovered.dni,
        });
        this.serverErrors.set({});
        this.formMessage.set(null);
        this.saveError.set(null);
        this.recovering.set(false);
      },
      error: (error: unknown) => {
        this.recovering.set(false);
        this.recoveryError.set(errorMessage(error));
      },
    });
  }
}
