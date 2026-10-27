import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop">
      <section class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
        <h2 id="confirm-dialog-title">{{ title() }}</h2>
        <p id="confirm-dialog-message">{{ message() }}</p>
        <div class="form-actions">
          <button class="button button--secondary" type="button" [disabled]="busy()" (click)="cancelled.emit()">Cancelar</button>
          <button class="button button--danger" type="button" [disabled]="busy()" (click)="confirmed.emit()">{{ busy() ? 'Procesando…' : confirmLabel() }}</button>
        </div>
      </section>
    </div>
  `
})
export class ConfirmDialog {
  readonly title = input<string>('Confirmar acción');
  readonly message = input<string>('¿Quieres continuar?');
  readonly confirmLabel = input<string>('Confirmar');
  readonly busy = input<boolean>(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
