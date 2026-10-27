import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/http/api-url';
import { Page } from '../../../shared/models/page';
import { QuoteRequest, QuoteResponse, VehicleFilters, VehicleResponse } from '../models/quotes.models';
import { createQuoteMock, listQuotableVehiclesMock, retrieveQuoteMock, updateQuoteMock } from './quotes.mock';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly http = inject(HttpClient);

  listQuotableVehicles(filters: VehicleFilters): Observable<Page<VehicleResponse>> {
    if (environment.useMock) return listQuotableVehiclesMock(filters);
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.model) params = params.set('model', filters.model);
    if (filters.version) params = params.set('version', filters.version);
    if (filters.year !== undefined) params = params.set('year', filters.year);
    return this.http.get<Page<VehicleResponse>>(apiUrl('/api/quotes/vehicles'), { params });
  }

  createQuote(request: QuoteRequest): Observable<QuoteResponse> {
    if (environment.useMock) return createQuoteMock(request);
    return this.http.post<QuoteResponse>(apiUrl('/api/quotes'), request);
  }

  updateQuote(id: string, request: QuoteRequest): Observable<QuoteResponse> {
    if (environment.useMock) return updateQuoteMock(id, request);
    return this.http.put<QuoteResponse>(apiUrl(`/api/quotes/${encodeURIComponent(id)}`), request);
  }

  retrieveQuote(id: string, dni: string): Observable<QuoteResponse> {
    if (environment.useMock) return retrieveQuoteMock(id, dni);
    return this.http.get<QuoteResponse>(apiUrl(`/api/quotes/${encodeURIComponent(id)}`), { params: new HttpParams().set('dni', dni) });
  }
}
