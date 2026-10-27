import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { PageHeader } from '../../../../shared/components/page-header';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { DocumentType, PersonType, PolicyholderDetailResponse, PolicyholderRequest } from '../../models/policyholders.models';

type Field = keyof PolicyholderRequest;
@Component({
  selector: 'app-policyholder-form-page',
  imports: [ReactiveFormsModule, RouterLink, PageHeader],
  templateUrl: './policyholder-form-page.html',
  styleUrl: './policyholder-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyholderFormPage {
  readonly id = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly form = inject(NonNullableFormBuilder).group({
    personType: ['NATURAL' as PersonType, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    documentType: ['DNI' as DocumentType, Validators.required],
    documentNumber: ['', [Validators.required, Validators.pattern(/^[0-9 .-]+$/)]],
    primaryContact: ['', Validators.maxLength(120)],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    phone: ['', Validators.maxLength(40)],
    address: ['', Validators.maxLength(200)]
  });
  protected readonly loadState = toSignal(toObservable(this.id).pipe(switchMap((id): Observable<LoadState<PolicyholderDetailResponse | null>> =>
    id ? toLoadState<PolicyholderDetailResponse | null>(this.service.getPolicyholder(id)) : of({ status: 'ready', data: null })
  ), tap(state => {
    if (state.status === 'ready' && state.data) {
      const { personType, name, documentType, documentNumber, primaryContact, email, phone, address } = state.data;
      this.form.reset({ personType, name, documentType, documentNumber, primaryContact: primaryContact ?? '', email: email ?? '', phone: phone ?? '', address: address ?? '' });
    }
  })), { initialValue: { status: 'loading' } as LoadState<PolicyholderDetailResponse | null> });
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
    if (control.hasError('email')) return 'Ingresá un correo electrónico válido.';
    if (control.hasError('pattern')) return 'Ingresá solo números y separadores.';
    return 'Revisá este campo.';
  }
  protected submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const request = this.form.getRawValue();
    const id = this.id();
    this.saving.set(true);
    this.submitError.set(null);
    (id ? this.service.updatePolicyholder(id, request) : this.service.createPolicyholder(request)).subscribe({
      next: holder => void this.router.navigate(['/policyholders', holder.id]),
      error: (error: unknown) => { this.saving.set(false); this.submitError.set(errorMessage(error)); if (error instanceof ApiProblemError) this.serverErrors.set(error.fieldErrors); this.form.markAllAsTouched(); }
    });
  }
  protected retry(): void { void this.router.navigate(['/policyholders', this.route.snapshot.paramMap.get('id')]); }
}
