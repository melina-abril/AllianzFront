import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" role="alert">
      <p>{{ message() }}</p>
      <button class="button button--secondary" type="button" (click)="retry.emit()">{{ retryLabel() }}</button>
    </div>
  `
})
export class ErrorAlert {
  readonly message = input<string>('No pudimos cargar la información.');
  readonly retryLabel = input<string>('Reintentar');
  readonly retry = output<void>();
}
