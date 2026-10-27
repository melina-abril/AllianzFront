import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { toPage } from '../../../shared/models/page';
import { PolicyholderDetailResponse, PolicyholderFilters, PolicyholderPage, PolicyholderRequest, VehicleRequest, VehicleResponse } from '../models/policyholders.models';

// Datos simulados en memoria; se reemplazan al conectar el backend.
let records: PolicyholderDetailResponse[] = [
  {
    id: 'ph-1001', name: 'Transporte Belgrano S.R.L.', personType: 'LEGAL', documentType: 'CUIT', documentNumber: '30-71548269-4', status: 'ACTIVE',
    primaryContact: 'Sofía Benítez', email: 'administracion@tbelgrano.com.ar', phone: '+54 11 4832-6190', address: 'Av. Córdoba 2856, CABA', vehicleCount: 2, activePolicyCount: 1,
    vehicles: [
      { id: 'v-1', plate: 'AB 123 CD', brand: 'Toyota', model: 'Hilux', year: 2023, engine: '2GD7621845', chassis: '8AJHA3CD1P0136421', covered: true },
      { id: 'v-2', plate: 'AE 789 GH', brand: 'Fiat', model: 'Fiorino', year: 2021, engine: '3271946', chassis: '9BD2651J1M9142630', covered: false }
    ],
    policies: [
      { number: 'AU-2026-08421', status: 'ACTIVE', coverageDescription: 'Flota comercial', vehiclePlates: ['AB 123 CD'], startDate: '2026-03-01', endDate: '2027-02-28' },
      { number: 'AU-2024-06318', status: 'EXPIRED', coverageDescription: 'Terceros completo', vehiclePlates: ['AE 789 GH'], startDate: '2024-11-01', endDate: '2025-10-31' }
    ],
    claims: [{ number: 'SI-2026-01287', status: 'IN_REVIEW', vehiclePlate: 'AB 123 CD', reason: 'Daños por granizo', reportedDate: '2026-09-12' }]
  },
  {
    id: 'ph-1002', name: 'Mariana Pérez', personType: 'NATURAL', documentType: 'DNI', documentNumber: '32.486.751', status: 'ACTIVE',
    primaryContact: null, email: 'mariana.perez@example.com', phone: '11 4567-8901', address: 'San Martín 320, CABA', vehicleCount: 1, activePolicyCount: 1,
    vehicles: [{ id: 'v-3', plate: 'AC 456 EF', brand: 'Renault', model: 'Kangoo', year: 2022, engine: 'K9K846327', chassis: '8A1FC0J02NL283741', covered: true }],
    policies: [{ number: 'AU-2026-09120', status: 'ACTIVE', coverageDescription: 'Terceros completo', vehiclePlates: ['AC 456 EF'], startDate: '2026-05-01', endDate: '2027-04-30' }], claims: []
  },
  {
    id: 'ph-1003', name: 'Ricardo Castro', personType: 'NATURAL', documentType: 'DNI', documentNumber: '25.718.430', status: 'ACTIVE',
    primaryContact: null, email: null, phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: []
  },
  {
    id: 'ph-1004', name: 'Servicios Moreno S.A.', personType: 'LEGAL', documentType: 'CUIT', documentNumber: '30-69821357-8', status: 'INACTIVE',
    primaryContact: 'Alejandro Moreno', email: null, phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: []
  },
  {
    id: 'ph-1005', name: 'Lucía González', personType: 'NATURAL', documentType: 'DNI', documentNumber: '37.205.184', status: 'ACTIVE',
    primaryContact: null, email: 'lucia.gonzalez@example.com', phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: []
  }
];

const digits = (value: string): string => value.replace(/\D/g, '');
const plateKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toUpperCase();
const missing = (): Observable<never> => mockError(404, 'No se encontró el registro solicitado.');

export function listPolicyholdersMock(filters: PolicyholderFilters): Observable<PolicyholderPage> {
  const search = filters.search.trim().toLocaleLowerCase();
  const matching = records.filter(item => !search || item.name.toLocaleLowerCase().includes(search) || (digits(search).length > 0 && digits(item.documentNumber) === digits(search)));
  return mockResponse(toPage(matching.map(({ id, name, personType, documentType, documentNumber, status }) => ({ id, name, personType, documentType, documentNumber, status })), filters.page, filters.size));
}

export function getPolicyholderMock(id: string): Observable<PolicyholderDetailResponse> {
  const item = records.find(record => record.id === id);
  return item ? mockResponse(item) : missing();
}

export function createPolicyholderMock(request: PolicyholderRequest): Observable<PolicyholderDetailResponse> {
  if (records.some(item => digits(item.documentNumber) === digits(request.documentNumber))) return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  const item: PolicyholderDetailResponse = { ...request, id: `ph-${Date.now()}`, status: 'ACTIVE', vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: [] };
  records = [item, ...records];
  return mockResponse(item);
}

export function updatePolicyholderMock(id: string, request: PolicyholderRequest): Observable<PolicyholderDetailResponse> {
  const current = records.find(item => item.id === id);
  if (!current) return missing();
  if (records.some(item => item.id !== id && digits(item.documentNumber) === digits(request.documentNumber))) return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  const updated = { ...current, ...request };
  records = records.map(item => item.id === id ? updated : item);
  return mockResponse(updated);
}

export function deactivatePolicyholderMock(id: string): Observable<void> {
  const current = records.find(item => item.id === id);
  if (!current) return missing();
  if (current.activePolicyCount > 0) return mockError(422, 'No se puede dar de baja a un asegurado con pólizas vigentes.');
  if (current.status === 'INACTIVE') return mockError(422, 'El asegurado ya está dado de baja.');
  records = records.map(item => item.id === id ? { ...item, status: 'INACTIVE' } : item);
  return mockResponse(undefined);
}

export function createVehicleMock(id: string, request: VehicleRequest): Observable<VehicleResponse> {
  const current = records.find(item => item.id === id);
  if (!current) return missing();
  if (records.some(item => item.vehicles.some(vehicle => plateKey(vehicle.plate) === plateKey(request.plate)))) return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const vehicle: VehicleResponse = { ...request, id: `v-${Date.now()}`, covered: false };
  records = records.map(item => item.id === id ? { ...item, vehicles: [...item.vehicles, vehicle], vehicleCount: item.vehicleCount + 1 } : item);
  return mockResponse(vehicle);
}

export function updateVehicleMock(id: string, vehicleId: string, request: VehicleRequest): Observable<VehicleResponse> {
  const current = records.find(item => item.id === id);
  const vehicle = current?.vehicles.find(item => item.id === vehicleId);
  if (!current || !vehicle) return missing();
  if (records.some(item => item.vehicles.some(other => other.id !== vehicleId && plateKey(other.plate) === plateKey(request.plate)))) return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const updated: VehicleResponse = { ...vehicle, ...request };
  records = records.map(item => item.id === id ? { ...item, vehicles: item.vehicles.map(other => other.id === vehicleId ? updated : other) } : item);
  return mockResponse(updated);
}
