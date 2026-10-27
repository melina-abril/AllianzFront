import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-policyholder-search',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form [formGroup]="form" (ngSubmit)="apply()" role="search"><label for="policyholder-search">Buscar asegurado</label><div class="search-box"><span aria-hidden="true">⌕</span><input id="policyholder-search" type="search" formControlName="search" placeholder="Nombre, DNI o CUIT" /></div><button class="visually-hidden" type="submit">Buscar</button></form>`,
  styles: `label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 10px; } .search-box { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 12px; border: 1px solid var(--border); border-radius: 9px; color: var(--text-secondary); } input { width: 100%; min-width: 0; border: 0; background: transparent; color: var(--text-primary); font: inherit; outline: none; } input:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }`
})
export class PolicyholderSearch {
  readonly applied = output<string>();
  protected readonly form = inject(NonNullableFormBuilder).group({ search: [''] });
  protected apply(): void { this.applied.emit(this.form.controls.search.value.trim()); }
}
