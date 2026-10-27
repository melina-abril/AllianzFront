import { CurrencyPipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  private readonly currency = new CurrencyPipe(inject(LOCALE_ID));

  transform(value: number | string | null | undefined, currencyCode = 'ARS'): string | null {
    return this.currency.transform(value, currencyCode, 'symbol', '1.2-2', 'es-AR');
  }
}
