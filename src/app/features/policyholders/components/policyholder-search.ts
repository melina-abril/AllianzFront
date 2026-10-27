import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-policyholder-search',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<form [formGroup]="form" (ngSubmit)="apply()" role="search" class="search-form"><label for="buscar-asegurado">Buscar asegurado</label><div class="search-form__row"><input id="buscar-asegurado" type="search" formControlName="search" placeholder="Nombre, DNI o CUIT" /><button type="submit" class="button">Buscar</button></div></form>`,
  styles: `.search-form label { display:block; font-size:14px; font-weight:700; margin-bottom:10px; } .search-form__row { display:flex; gap:8px; } .search-form input { min-width:0; flex:1; border:1px solid var(--border); border-radius:9px; padding:10px 12px; color:var(--text-primary); background:var(--surface); font:inherit; } .search-form .button { min-height:44px; }`,
})
export class PolicyholderSearch {
  readonly applied = output<string>();
  protected readonly form = inject(NonNullableFormBuilder).group({ search: [''] });
  protected apply(): void { this.applied.emit(this.form.controls.search.value.trim()); }
}
