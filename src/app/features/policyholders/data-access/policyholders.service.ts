import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { apiUrl } from '../../../core/http/api-url';
import { Page } from '../../../shared/models/page';
import { Policyholder, PolicyholderFilters, PolicyholderRequest, Vehicle, VehicleRequest } from '../models/policyholders.models';
import { addVehicleMock, createPolicyholderMock, deactivatePolicyholderMock, getPolicyholderMock, listPolicyholdersMock, updatePolicyholderMock, updateVehicleMock } from './policyholders.mock';

/** Un método por endpoint; los mocks se reemplazan al conectar el backend. */
@Injectable({ providedIn: 'root' })
export class PolicyholdersService {
  private readonly http = inject(HttpClient);

  listPolicyholders(filters: PolicyholderFilters): Observable<Page<Policyholder>> {
    if (environment.useMock) return listPolicyholdersMock(filters);
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    if (filters.search.trim()) params = params.set('search', filters.search.trim());
    return this.http.get<Page<Policyholder>>(apiUrl('/api/policyholders'), { params });
  }

  getPolicyholder(id: string): Observable<Policyholder> {
    if (environment.useMock) return getPolicyholderMock(id);
    return this.http.get<Policyholder>(apiUrl(`/api/policyholders/${encodeURIComponent(id)}`));
  }

  createPolicyholder(request: PolicyholderRequest): Observable<Policyholder> {
    if (environment.useMock) return createPolicyholderMock(request);
    return this.http.post<Policyholder>(apiUrl('/api/policyholders'), request);
  }

  updatePolicyholder(id: string, request: PolicyholderRequest): Observable<Policyholder> {
    if (environment.useMock) return updatePolicyholderMock(id, request);
    return this.http.put<Policyholder>(apiUrl(`/api/policyholders/${encodeURIComponent(id)}`), request);
  }

  addVehicle(id: string, request: VehicleRequest): Observable<Vehicle> {
    if (environment.useMock) return addVehicleMock(id, request);
    return this.http.post<Vehicle>(apiUrl(`/api/policyholders/${encodeURIComponent(id)}/vehicles`), request);
  }

  updateVehicle(id: string, vehicleId: string, request: VehicleRequest): Observable<Vehicle> {
    if (environment.useMock) return updateVehicleMock(id, vehicleId, request);
    return this.http.put<Vehicle>(apiUrl(`/api/policyholders/${encodeURIComponent(id)}/vehicles/${encodeURIComponent(vehicleId)}`), request);
  }

  deactivatePolicyholder(id: string): Observable<void> {
    if (environment.useMock) return deactivatePolicyholderMock(id);
    return this.http.delete<void>(apiUrl(`/api/policyholders/${encodeURIComponent(id)}`));
  }
}
