import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { errorMessage } from '../../../../core/http/api-error';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog';
import { ErrorAlert } from '../../../../shared/components/error-alert';
import { LoadingState } from '../../../../shared/components/loading-state';
import { LoadState } from '../../../../shared/models/load-state';
import { toLoadState } from '../../../../shared/utils/to-load-state';
import { PolicyholdersService } from '../../data-access/policyholders.service';
import { PolicyholderResponse } from '../../models/policyholders.models';

@Component({ selector: 'app-policyholder-deactivate-page', imports: [RouterLink, ConfirmDialog, ErrorAlert, LoadingState], templateUrl: './policyholder-deactivate-page.html', styleUrl: './policyholder-deactivate-page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class PolicyholderDeactivatePage {
  readonly id = input.required<string>();
  private readonly service = inject(PolicyholdersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly holderState = toSignal(toObservable(this.id).pipe(switchMap(id => toLoadState(this.service.getPolicyholder(id)))), { initialValue: { status: 'loading' } as LoadState<PolicyholderResponse> });
  protected readonly confirming = signal(false);
  protected readonly busy = signal(false);
  protected readonly actionError = signal<string | null>(null);
  protected deactivate(): void {
    this.busy.set(true); this.actionError.set(null);
    this.service.deactivatePolicyholder(this.id()).subscribe({
      next: () => void this.router.navigate(['..'], { relativeTo: this.route }),
      error: (error: unknown) => { this.busy.set(false); this.confirming.set(false); this.actionError.set(errorMessage(error)); }
    });
  }
}
