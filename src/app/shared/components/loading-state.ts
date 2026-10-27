import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p role="status" aria-live="polite">{{ message() }}</p>`
})
export class LoadingState {
  readonly message = input<string>('Cargando…');
}
