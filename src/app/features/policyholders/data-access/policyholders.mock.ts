import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { Page, toPage } from '../../../shared/models/page';
import { Policyholder, PolicyholderFilters, PolicyholderRequest, Vehicle, VehicleRequest } from '../models/policyholders.models';

/** Datos simulados en memoria; se reemplazan al conectar el backend. */
let holders: Policyholder[] = [
  {
    id: 'ph-1001', personType: 'LEGAL_ENTITY', name: 'Transporte Belgrano S.R.L.', documentNumber: '30-71548269-4', status: 'ACTIVE',
    primaryContact: 'Sofía Benítez', email: 'administracion@tbelgrano.com.ar', phone: '+54 11 4832-6190', address: 'Av. Córdoba 2856, CABA', vehicleCount: 5, activePolicyCount: 1, updatedAt: '2026-02-20T14:00:00Z',
    vehicles: [
      { id: 'v-1', plate: 'AB 123 CD', brand: 'Toyota', model: 'Hilux', year: 2023, engineNumber: '2GD7621845', chassisNumber: '8AJHA3CD1P0136421', covered: true },
      { id: 'v-2', plate: 'AC 456 EF', brand: 'Renault', model: 'Kangoo', year: 2022, engineNumber: 'K9K846327', chassisNumber: '8A1FC0J02NL283741', covered: true },
      { id: 'v-3', plate: 'AE 789 GH', brand: 'Fiat', model: 'Fiorino', year: 2021, engineNumber: '3271946', chassisNumber: '9BD2651J1M9142630', covered: false },
      { id: 'v-4', plate: 'AF 234 JK', brand: 'Ford', model: 'Ranger', year: 2024, engineNumber: 'P5AT482631', chassisNumber: '8AFAR23N5RJ184207', covered: true },
      { id: 'v-5', plate: 'AG 567 LM', brand: 'Volkswagen', model: 'Amarok', year: 2023, engineNumber: 'DDA568214', chassisNumber: 'WV1ZZZ2HZPH042815', covered: true },
    ],
    policies: [
      { number: 'AU-2026-08421', status: 'ACTIVE', coverageDescription: 'Flota comercial', vehicleIds: ['v-1', 'v-2', 'v-4', 'v-5'], startDate: '2026-03-01', endDate: '2027-02-28' },
      { number: 'AU-2024-06318', status: 'EXPIRED', coverageDescription: 'Fiat Fiorino', vehicleIds: ['v-3'], startDate: '2024-11-01', endDate: '2025-10-31' },
    ],
    claims: [
      { number: 'SIN-2026-01184', status: 'IN_REVIEW', vehicleId: 'v-4', vehiclePlate: 'AF 234 JK', reason: 'Choque leve', reportedDate: '2026-02-14' },
      { number: 'SIN-2025-04872', status: 'CLOSED', vehicleId: 'v-1', vehiclePlate: 'AB 123 CD', reason: 'Rotura de cristal', reportedDate: '2025-11-03' },
    ],
  },
  { id: 'ph-1002', personType: 'INDIVIDUAL', name: 'Mariana Pérez', documentNumber: '32.486.751', status: 'ACTIVE', primaryContact: null, email: 'mariana.perez@correo.com', phone: '11 4521-8970', address: 'Belgrano, CABA', vehicleCount: 1, activePolicyCount: 1, updatedAt: '2026-02-18T10:00:00Z', vehicles: [{ id: 'v-6', plate: 'AD 375 BC', brand: 'Volkswagen', model: 'Polo', year: 2022, engineNumber: 'CFZ58214', chassisNumber: '9BWZZZ377NT010239', covered: true }], policies: [{ number: 'AU-2026-02145', status: 'ACTIVE', coverageDescription: 'Terceros completo', vehicleIds: ['v-6'], startDate: '2026-01-01', endDate: '2026-12-31' }], claims: [] },
  { id: 'ph-1003', personType: 'INDIVIDUAL', name: 'Ricardo Castro', documentNumber: '25.718.430', status: 'ACTIVE', primaryContact: null, email: null, phone: '11 4056-1234', address: null, vehicleCount: 1, activePolicyCount: 0, updatedAt: '2026-01-20T10:00:00Z', vehicles: [{ id: 'v-7', plate: 'AB 478 TY', brand: 'Chevrolet', model: 'Onix', year: 2020, engineNumber: 'L2C23109', chassisNumber: '9BGKS69T0LG348271', covered: false }], policies: [], claims: [] },
  { id: 'ph-1004', personType: 'LEGAL_ENTITY', name: 'Servicios Moreno S.A.', documentNumber: '30-69821357-8', status: 'INACTIVE', primaryContact: null, email: null, phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, updatedAt: '2025-12-01T10:00:00Z', vehicles: [], policies: [], claims: [] },
  { id: 'ph-1005', personType: 'INDIVIDUAL', name: 'Lucía González', documentNumber: '37.205.184', status: 'ACTIVE', primaryContact: null, email: 'lucia.gonzalez@correo.com', phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, updatedAt: '2026-02-05T10:00:00Z', vehicles: [], policies: [], claims: [] },
];

const digits = (value: string): string => value.replace(/[^0-9]/g, '');
const plateKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toUpperCase();
const missing = (id: string): Observable<never> => mockError(404, `No existe el asegurado ${id}.`);

export function listPolicyholdersMock(filters: PolicyholderFilters): Observable<Page<Policyholder>> {
  const search = filters.search.trim().toLocaleLowerCase();
  const numeric = digits(search);
  const matches = holders.filter(holder => !search || holder.name.toLocaleLowerCase().includes(search) ||
    (numeric.length > 0 && digits(holder.documentNumber) === numeric));
  return mockResponse(toPage(matches, filters.page, filters.size));
}

export function getPolicyholderMock(id: string): Observable<Policyholder> {
  const holder = holders.find(item => item.id === id);
  return holder ? mockResponse({ ...holder }) : missing(id);
}

export function createPolicyholderMock(request: PolicyholderRequest): Observable<Policyholder> {
  if (holders.some(item => digits(item.documentNumber) === digits(request.documentNumber)))
    return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  const holder: Policyholder = { ...request, id: `ph-${Date.now()}`, status: 'ACTIVE', vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: [], updatedAt: new Date().toISOString() };
  holders = [holder, ...holders];
  return mockResponse(holder);
}

export function updatePolicyholderMock(id: string, request: PolicyholderRequest): Observable<Policyholder> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return missing(id);
  if (holders.some(item => item.id !== id && digits(item.documentNumber) === digits(request.documentNumber)))
    return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  const updated = { ...holder, ...request, updatedAt: new Date().toISOString() };
  holders = holders.map(item => item.id === id ? updated : item);
  return mockResponse(updated);
}

export function addVehicleMock(id: string, request: VehicleRequest): Observable<Vehicle> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return missing(id);
  if (holders.some(item => item.vehicles.some(vehicle => plateKey(vehicle.plate) === plateKey(request.plate))))
    return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const vehicle: Vehicle = { ...request, id: `v-${Date.now()}`, covered: false };
  holders = holders.map(item => item.id === id ? { ...item, vehicles: [...item.vehicles, vehicle], vehicleCount: item.vehicleCount + 1, updatedAt: new Date().toISOString() } : item);
  return mockResponse(vehicle);
}

export function updateVehicleMock(id: string, vehicleId: string, request: VehicleRequest): Observable<Vehicle> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return missing(id);
  const current = holder.vehicles.find(item => item.id === vehicleId);
  if (!current) return mockError(404, 'No se encontró el vehículo.');
  if (holders.some(item => item.vehicles.some(vehicle => vehicle.id !== vehicleId && plateKey(vehicle.plate) === plateKey(request.plate))))
    return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const vehicle = { ...current, ...request };
  holders = holders.map(item => item.id === id ? { ...item, vehicles: item.vehicles.map(entry => entry.id === vehicleId ? vehicle : entry), updatedAt: new Date().toISOString() } : item);
  return mockResponse(vehicle);
}

export function deactivatePolicyholderMock(id: string): Observable<void> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return missing(id);
  if (holder.status === 'INACTIVE' || holder.activePolicyCount > 0)
    return mockError(422, 'No se puede dar de baja un asegurado con pólizas vigentes o que ya esté de baja.');
  holders = holders.map(item => item.id === id ? { ...item, status: 'INACTIVE', updatedAt: new Date().toISOString() } : item);
  return mockResponse(undefined);
}
