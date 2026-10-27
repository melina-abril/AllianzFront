import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/http/api-url';
import { PolicyholderDetailResponse, PolicyholderFilters, PolicyholderPage, PolicyholderRequest, VehicleRequest, VehicleResponse } from '../models/policyholders.models';
import { createPolicyholderMock, createVehicleMock, deactivatePolicyholderMock, getPolicyholderMock, listPolicyholdersMock, updatePolicyholderMock, updateVehicleMock } from './policyholders.mock';

@Injectable({ providedIn: 'root' })
export class PolicyholdersService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/policyholders';

  listPolicyholders(filters: PolicyholderFilters): Observable<PolicyholderPage> {
    if (environment.useMock) return listPolicyholdersMock(filters);
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<PolicyholderPage>(apiUrl(this.base), { params });
  }

  getPolicyholder(id: string): Observable<PolicyholderDetailResponse> {
    if (environment.useMock) return getPolicyholderMock(id);
    return this.http.get<PolicyholderDetailResponse>(apiUrl(`${this.base}/${encodeURIComponent(id)}`));
  }

  createPolicyholder(request: PolicyholderRequest): Observable<PolicyholderDetailResponse> {
    if (environment.useMock) return createPolicyholderMock(request);
    return this.http.post<PolicyholderDetailResponse>(apiUrl(this.base), request);
  }

  updatePolicyholder(id: string, request: PolicyholderRequest): Observable<PolicyholderDetailResponse> {
    if (environment.useMock) return updatePolicyholderMock(id, request);
    return this.http.put<PolicyholderDetailResponse>(apiUrl(`${this.base}/${encodeURIComponent(id)}`), request);
  }

  deactivatePolicyholder(id: string): Observable<void> {
    if (environment.useMock) return deactivatePolicyholderMock(id);
    return this.http.delete<void>(apiUrl(`${this.base}/${encodeURIComponent(id)}`));
  }

  createVehicle(id: string, request: VehicleRequest): Observable<VehicleResponse> {
    if (environment.useMock) return createVehicleMock(id, request);
    return this.http.post<VehicleResponse>(apiUrl(`${this.base}/${encodeURIComponent(id)}/vehicles`), request);
  }

  updateVehicle(id: string, vehicleId: string, request: VehicleRequest): Observable<VehicleResponse> {
    if (environment.useMock) return updateVehicleMock(id, vehicleId, request);
    return this.http.put<VehicleResponse>(apiUrl(`${this.base}/${encodeURIComponent(id)}/vehicles/${encodeURIComponent(vehicleId)}`), request);
  }
}
