import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="card">{{ message() }}</p>`
})
export class EmptyState {
  readonly message = input<string>('No hay resultados.');
}
