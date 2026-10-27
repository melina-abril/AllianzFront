import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/http/api-url';
import { Page } from '../../../shared/models/page';
import { PolicyholderFilters, PolicyholderRequest, PolicyholderResponse, VehicleRequest, VehicleResponse } from '../models/policyholders.models';
import { addVehicleMock, createPolicyholderMock, deactivatePolicyholderMock, getPolicyholderMock, listPolicyholdersMock, updatePolicyholderMock, updateVehicleMock } from './policyholders.mock';

/** Un método por operación del contrato; el mock se reemplaza al conectar el backend. */
@Injectable({ providedIn: 'root' })
export class PolicyholdersService {
  private readonly http = inject(HttpClient);
  private readonly path = '/api/policyholders';

  listPolicyholders(filters: PolicyholderFilters): Observable<Page<PolicyholderResponse>> {
    if (environment.useMock) return listPolicyholdersMock(filters);
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<Page<PolicyholderResponse>>(apiUrl(this.path), { params });
  }

  getPolicyholder(id: string): Observable<PolicyholderResponse> {
    if (environment.useMock) return getPolicyholderMock(id);
    return this.http.get<PolicyholderResponse>(apiUrl(`${this.path}/${encodeURIComponent(id)}`));
  }

  createPolicyholder(request: PolicyholderRequest): Observable<PolicyholderResponse> {
    if (environment.useMock) return createPolicyholderMock(request);
    return this.http.post<PolicyholderResponse>(apiUrl(this.path), request);
  }

  updatePolicyholder(id: string, request: PolicyholderRequest): Observable<PolicyholderResponse> {
    if (environment.useMock) return updatePolicyholderMock(id, request);
    return this.http.put<PolicyholderResponse>(apiUrl(`${this.path}/${encodeURIComponent(id)}`), request);
  }

  addVehicle(id: string, request: VehicleRequest): Observable<VehicleResponse> {
    if (environment.useMock) return addVehicleMock(id, request);
    return this.http.post<VehicleResponse>(apiUrl(`${this.path}/${encodeURIComponent(id)}/vehicles`), request);
  }

  updateVehicle(id: string, vehicleId: string, request: VehicleRequest): Observable<VehicleResponse> {
    if (environment.useMock) return updateVehicleMock(id, vehicleId, request);
    return this.http.put<VehicleResponse>(apiUrl(`${this.path}/${encodeURIComponent(id)}/vehicles/${encodeURIComponent(vehicleId)}`), request);
  }

  deactivatePolicyholder(id: string): Observable<void> {
    if (environment.useMock) return deactivatePolicyholderMock(id);
    return this.http.delete<void>(apiUrl(`${this.path}/${encodeURIComponent(id)}`));
  }
}
