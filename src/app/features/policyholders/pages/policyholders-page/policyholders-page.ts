import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ApiProblemError, errorMessage } from '../../../../core/http/api-error';
import { CurrentUser } from '../../../../core/session/current-user';
import { PageHeader } from '../../../../shared/components/page-header';
import { StatusBadge } from '../../../../shared/components/status-badge';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { CLAIM_STATUS, POLICY_STATUS, POLICYHOLDER_STATUS, PolicyholderDetailResponse, PolicyholderFilters, PolicyholderPage } from '../../models/policyholders.models';

@Component({
  selector: 'app-policyholders-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, PageHeader, StatusBadge],
  templateUrl: './policyholders-page.html',
  styleUrl: './policyholders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyholdersPage {
  readonly id = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly user = inject(CurrentUser);
  private readonly router = inject(Router);
  protected readonly allowed = computed(() => this.user.hasRole(['producer', 'operator', 'supervisor']));
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly filters = signal<PolicyholderFilters>({ search: '', page: 0, size: 10 });
  private readonly refresh = signal(0);
  private readonly listRequest = computed(() => ({ ...this.filters(), refresh: this.refresh() }));
  protected readonly listState = toSignal(toObservable(this.listRequest).pipe(switchMap(({ search, page, size }) =>
    toLoadState(this.service.listPolicyholders({ search, page, size }).pipe(catchError((error: unknown) => throwError(() => new Error(
      error instanceof ApiProblemError && error.status === 403 ? 'No tenés permiso para consultar asegurados' : 'No pudimos cargar los asegurados. Intentá nuevamente'
    )))))
  )), { initialValue: { status: 'loading' } as LoadState<PolicyholderPage> });
  protected readonly selectedId = computed(() => {
    const list = this.listState();
    if (list.status !== 'ready') return null;
    return list.data.items.find(item => item.id === this.id())?.id ?? list.data.items[0]?.id ?? null;
  });
  private readonly detailRequest = computed(() => ({ id: this.selectedId(), refresh: this.refresh() }));
  protected readonly detailState = toSignal(toObservable(this.detailRequest).pipe(switchMap(({ id }) =>
    id ? toLoadState(this.service.getPolicyholder(id).pipe(catchError((error: unknown) => throwError(() => new Error(
      error instanceof ApiProblemError && error.status === 403 ? 'No tenés permiso para consultar asegurados' : 'No pudimos cargar los asegurados. Intentá nuevamente'
    ))))) : toLoadState(this.service.getPolicyholder(''))
  )), { initialValue: { status: 'loading' } as LoadState<PolicyholderDetailResponse> });
  protected readonly holderStatus = POLICYHOLDER_STATUS;
  protected readonly policyStatus = POLICY_STATUS;
  protected readonly claimStatus = CLAIM_STATUS;
  protected readonly confirming = signal(false);
  protected readonly deleting = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected search(): void {
    this.filters.update(current => ({ ...current, search: this.searchControl.value.trim(), page: 0 }));
    void this.router.navigate(['/policyholders']);
  }
  protected pageTo(page: number): void {
    this.filters.update(current => ({ ...current, page }));
    void this.router.navigate(['/policyholders']);
  }
  protected retry(): void { this.refresh.update(value => value + 1); }
  protected deactivate(id: string): void {
    this.deleting.set(true);
    this.actionError.set(null);
    this.service.deactivatePolicyholder(id).subscribe({
      next: () => { this.deleting.set(false); this.confirming.set(false); this.retry(); },
      error: (error: unknown) => { this.deleting.set(false); this.confirming.set(false); this.actionError.set(errorMessage(error)); }
    });
  }
}
