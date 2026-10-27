import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiProblemError } from '../../../../core/http/api-error';
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
import { claimStatus, documentType, PERSON_TYPE, Policyholder, PolicyholderFilters, POLICYHOLDER_STATUS, policyStatus } from '../../models/policyholders.models';

@Component({
  selector: 'app-policyholders-page',
  imports: [DatePipe, RouterLink, LoadingState, EmptyState, ErrorAlert, StatusBadge, PolicyholderSearch],
  templateUrl: './policyholders-page.html',
  styleUrl: './policyholders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PolicyholdersPage {
  readonly id = input<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly currentUser = inject(CurrentUser);
  protected readonly authorized = computed(() => this.currentUser.hasRole(['producer', 'operator', 'supervisor']));
  protected readonly filters = signal<PolicyholderFilters>({ search: '', page: 0, size: 10 });
  private readonly refresh = signal(0);
  private readonly listRequest = computed(() => ({ filters: this.filters(), refresh: this.refresh() }));
  protected readonly listState = toSignal(toObservable(this.listRequest).pipe(switchMap(({ filters }) => toLoadState(this.service.listPolicyholders(filters)))), { initialValue: { status: 'loading' } as LoadState<Page<Policyholder>> });
  protected readonly selectedId = computed(() => {
    const list = this.listState();
    if (list.status !== 'ready') return null;
    return list.data.items.find(item => item.id === this.id())?.id ?? list.data.items[0]?.id ?? null;
  });
  protected readonly detailState = toSignal(toObservable(this.selectedId).pipe(switchMap(id => id ? toLoadState(this.service.getPolicyholder(id)) : toLoadState(this.service.listPolicyholders({ search: '\u0000', page: 0, size: 1 })))), { initialValue: { status: 'loading' } as LoadState<Policyholder | Page<Policyholder>> });
  protected readonly holderStatus = POLICYHOLDER_STATUS;
  protected readonly personType = PERSON_TYPE;
  protected readonly documentType = documentType;
  protected readonly policyStatus = policyStatus;
  protected readonly claimStatus = claimStatus;

  protected initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase(); }
  protected contact(value: string | null): string { return value?.trim() || 'No informado'; }
  protected findVehicle(holder: Policyholder, id: string): string { return holder.vehicles.find(vehicle => vehicle.id === id)?.plate ?? 'No informado'; }
  protected isPolicyholder(value: Policyholder | Page<Policyholder>): value is Policyholder { return 'id' in value; }
  protected search(value: string): void { this.filters.set({ search: value, page: 0, size: 10 }); }
  protected goToPage(page: number): void { this.filters.update(current => ({ ...current, page })); }
  protected retry(): void { this.refresh.update(value => value + 1); }
  protected listError(message: string): string { return message.includes('permiso') ? 'No tenés permiso para consultar asegurados' : 'No pudimos cargar los asegurados. Intentá nuevamente'; }
}
