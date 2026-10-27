import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of, switchMap, tap } from 'rxjs';
import { CurrentUser } from '../../../../core/session/current-user';
import { EmptyState } from '../../../../shared/components/empty-state';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { StatusBadge } from '../../../../shared/components/status-badge';
import { LoadState } from '../../../../shared/models/load-state';
import { Page } from '../../../../shared/models/page';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholderSearch } from '../../components/policyholder-search';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { CLAIM_STATUS, POLICY_STATUS, POLICYHOLDER_STATUS, PolicyholderFilters, PolicyholderResponse } from '../../models/policyholders.models';

@Component({
  selector: 'app-policyholders-page',
  imports: [DatePipe, RouterLink, LoadingState, EmptyState, ErrorAlert, StatusBadge, PolicyholderSearch],
  templateUrl: './policyholders-page.html',
  styleUrl: './policyholders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolicyholdersPage {
  private readonly service = inject(PolicyholdersService);
  private readonly currentUser = inject(CurrentUser);
  protected readonly authorized = computed(() => this.currentUser.hasRole(['producer', 'operator', 'supervisor']));
  protected readonly holderStatus = POLICYHOLDER_STATUS;
  protected readonly policyStatus = POLICY_STATUS;
  protected readonly claimStatus = CLAIM_STATUS;
  protected readonly filters = signal<PolicyholderFilters>({ search: '', page: 0, size: 10 });
  protected readonly selectedId = signal<string | null>(null);
  private readonly reloadCount = signal(0);
  private readonly request = computed(() => ({ filters: this.filters(), reload: this.reloadCount(), authorized: this.authorized() }));
  protected readonly listState = toSignal(
    toObservable(this.request).pipe(switchMap(({ filters, authorized }) => authorized
      ? toLoadState(this.service.listPolicyholders(filters)).pipe(tap(result => {
          if (result.status === 'ready') {
            if (!result.data.items.some(item => item.id === this.selectedId())) this.selectedId.set(result.data.items[0]?.id ?? null);
          } else if (result.status === 'empty' || result.status === 'error') this.selectedId.set(null);
        }))
      : of({ status: 'empty' } as LoadState<Page<PolicyholderResponse>>))),
    { initialValue: { status: 'loading' } as LoadState<Page<PolicyholderResponse>> }
  );
  private readonly detailRequest = computed(() => ({ id: this.selectedId(), reload: this.reloadCount(), authorized: this.authorized() }));
  protected readonly detailState = toSignal(
    toObservable(this.detailRequest).pipe(switchMap(({ id, authorized }) => id && authorized
      ? toLoadState(this.service.getPolicyholder(id))
      : of({ status: 'empty' } as LoadState<PolicyholderResponse>))),
    { initialValue: { status: 'empty' } as LoadState<PolicyholderResponse> }
  );

  protected applySearch(search: string): void {
    this.selectedId.set(null);
    this.filters.update(filters => ({ ...filters, search, page: 0 }));
  }
  protected select(id: string): void { this.selectedId.set(id); }
  protected goToPage(page: number): void {
    this.selectedId.set(null);
    this.filters.update(filters => ({ ...filters, page }));
  }
  protected reload(): void { this.selectedId.set(null); this.reloadCount.update(value => value + 1); }
  protected initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase(); }
  protected documentLabel(holder: PolicyholderResponse): string { return holder.personType === 'LEGAL_ENTITY' ? 'CUIT' : 'DNI'; }
  protected vehiclePlates(holder: PolicyholderResponse, ids: string[]): string {
    return holder.vehicles.filter(vehicle => ids.includes(vehicle.id)).map(vehicle => vehicle.plate).join(', ');
  }
}
