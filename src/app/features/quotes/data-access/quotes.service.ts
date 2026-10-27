import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/http/api-url';
import { QuoteRequest, QuoteResponse, VehicleCatalogResponse } from '../models/quotes.models';
import { createQuoteMock, getVehicleCatalogMock, recoverQuoteMock, updateQuoteMock } from './quotes.mock';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);

  getVehicleCatalog(): Observable<VehicleCatalogResponse> {
    if (environment.useMock) return getVehicleCatalogMock();
    return this.http.get<VehicleCatalogResponse>(apiUrl('/api/quotes/catalog'));
  }

  createQuote(request: QuoteRequest): Observable<QuoteResponse> {
    if (environment.useMock) return createQuoteMock(request);
    return this.http.post<QuoteResponse>(apiUrl('/api/quotes'), request);
  }

  updateQuote(number: string, request: QuoteRequest): Observable<QuoteResponse> {
    if (environment.useMock) return updateQuoteMock(number, request);
    return this.http.put<QuoteResponse>(apiUrl(`/api/quotes/${encodeURIComponent(number)}`), request);
  }

  recoverQuote(number: string, dni: string): Observable<QuoteResponse> {
    if (environment.useMock) return recoverQuoteMock(number, dni);
    const params = new HttpParams().set('dni', dni);
    return this.http.get<QuoteResponse>(apiUrl(`/api/quotes/${encodeURIComponent(number)}`), { params });
  }
}
