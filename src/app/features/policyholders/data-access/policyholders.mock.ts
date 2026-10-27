import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { Page, toPage } from '../../../shared/models/page';
import { PolicyholderFilters, PolicyholderRequest, PolicyholderResponse, VehicleRequest, VehicleResponse } from '../models/policyholders.models';

/** Datos simulados en memoria; se reemplazan al conectar el backend. */
let holders: PolicyholderResponse[] = [
  {
    id: 'ph-1001', personType: 'LEGAL_ENTITY', name: 'Transporte Belgrano S.R.L.', documentNumber: '30-71548269-4', status: 'ACTIVE',
    primaryContact: 'Sofía Benítez', email: 'administracion@tbelgrano.com.ar', phone: '+54 11 4832-6190', address: 'Av. Córdoba 2856, CABA',
    vehicleCount: 5, activePolicyCount: 1, updatedAt: '2026-10-20T14:32:00Z',
    vehicles: [
      { id: 'v-1', plate: 'AB 123 CD', brand: 'Toyota', model: 'Hilux', year: 2023, engineNumber: '2GD7621845', chassisNumber: '8AJHA3CD1P0136421', covered: true },
      { id: 'v-2', plate: 'AC 456 EF', brand: 'Renault', model: 'Kangoo', year: 2022, engineNumber: 'K9K846327', chassisNumber: '8A1FC0J02NL283741', covered: true },
      { id: 'v-3', plate: 'AE 789 GH', brand: 'Fiat', model: 'Fiorino', year: 2021, engineNumber: '3271946', chassisNumber: '9BD2651J1M9142630', covered: false },
      { id: 'v-4', plate: 'AF 234 JK', brand: 'Ford', model: 'Ranger', year: 2024, engineNumber: 'P5AT482631', chassisNumber: '8AFAR23N5RJ184207', covered: true },
      { id: 'v-5', plate: 'AG 567 LM', brand: 'Volkswagen', model: 'Amarok', year: 2023, engineNumber: 'DDA568214', chassisNumber: 'WV1ZZZ2HZPH042815', covered: true }
    ],
    policies: [
      { number: 'AU-2026-08421', status: 'ACTIVE', coverageDescription: 'Flota comercial', vehicleIds: ['v-1', 'v-2', 'v-4', 'v-5'], startDate: '2026-03-01', endDate: '2027-02-28' },
      { number: 'AU-2024-06318', status: 'EXPIRED', coverageDescription: 'Terceros completo', vehicleIds: ['v-3'], startDate: '2024-11-01', endDate: '2025-10-31' }
    ],
    claims: [{ number: 'SI-2026-0142', status: 'IN_REVIEW', vehicleId: 'v-1', vehiclePlate: 'AB 123 CD', reason: 'Daños por granizo', reportedDate: '2026-09-12' }]
  },
  { id: 'ph-1002', personType: 'INDIVIDUAL', name: 'Mariana Pérez', documentNumber: '32.486.751', status: 'ACTIVE', primaryContact: null, email: 'mariana.perez@example.com', phone: '+54 11 4567-8901', address: 'San Martín 120, CABA', vehicleCount: 1, activePolicyCount: 1, updatedAt: '2026-10-18T09:00:00Z', vehicles: [{ id: 'v-6', plate: 'AH 321 NO', brand: 'Peugeot', model: '208', year: 2024, engineNumber: 'EC562184', chassisNumber: '8ADCC2F91RJ023415', covered: true }], policies: [{ number: 'AU-2026-09001', status: 'ACTIVE', coverageDescription: 'Todo riesgo', vehicleIds: ['v-6'], startDate: '2026-06-01', endDate: '2027-05-31' }], claims: [] },
  { id: 'ph-1003', personType: 'INDIVIDUAL', name: 'Ricardo Castro', documentNumber: '25.718.430', status: 'ACTIVE', primaryContact: null, email: null, phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, updatedAt: '2026-10-11T12:00:00Z', vehicles: [], policies: [], claims: [] },
  { id: 'ph-1004', personType: 'LEGAL_ENTITY', name: 'Servicios Moreno S.A.', documentNumber: '30-69821357-8', status: 'INACTIVE', primaryContact: 'Juan Moreno', email: null, phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, updatedAt: '2026-09-30T11:00:00Z', vehicles: [], policies: [], claims: [] },
  { id: 'ph-1005', personType: 'INDIVIDUAL', name: 'Lucía González', documentNumber: '37.205.184', status: 'ACTIVE', primaryContact: null, email: 'lucia.gonzalez@example.com', phone: null, address: null, vehicleCount: 0, activePolicyCount: 0, updatedAt: '2026-10-15T10:00:00Z', vehicles: [], policies: [], claims: [] }
];

const digits = (value: string): string => value.replace(/[^0-9]/g, '');
const plateKey = (value: string): string => value.replace(/[^a-z0-9]/gi, '').toUpperCase();
const notFound = (): Observable<never> => mockError(404, 'No se encontró el asegurado o vehículo.');
const existingDocument = (number: string, except?: string): boolean => holders.some(holder => holder.id !== except && digits(holder.documentNumber) === digits(number));
const existingPlate = (plate: string, except?: string): boolean => holders.some(holder => holder.vehicles.some(vehicle => vehicle.id !== except && plateKey(vehicle.plate) === plateKey(plate)));

export function listPolicyholdersMock(filters: PolicyholderFilters): Observable<Page<PolicyholderResponse>> {
  const search = filters.search.trim().toLocaleLowerCase('es');
  const results = holders.filter(holder => !search || holder.name.toLocaleLowerCase('es').includes(search) || (digits(search).length > 0 && digits(holder.documentNumber) === digits(search)));
  return mockResponse(toPage(results, filters.page, filters.size));
}

export function getPolicyholderMock(id: string): Observable<PolicyholderResponse> {
  const holder = holders.find(item => item.id === id);
  return holder ? mockResponse(holder) : notFound();
}

export function createPolicyholderMock(request: PolicyholderRequest): Observable<PolicyholderResponse> {
  if (existingDocument(request.documentNumber)) return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  if (!request.name.trim() || !request.documentNumber.trim()) return mockError(422, 'Completá los datos obligatorios.');
  const holder: PolicyholderResponse = { ...request, id: `ph-${Date.now()}`, status: 'ACTIVE', vehicleCount: 0, activePolicyCount: 0, vehicles: [], policies: [], claims: [], updatedAt: new Date().toISOString() };
  holders = [holder, ...holders];
  return mockResponse(holder);
}

export function updatePolicyholderMock(id: string, request: PolicyholderRequest): Observable<PolicyholderResponse> {
  const current = holders.find(item => item.id === id);
  if (!current) return notFound();
  if (existingDocument(request.documentNumber, id)) return mockError(409, 'El DNI o CUIT ya está registrado.', { documentNumber: ['El documento ya está en uso.'] });
  const updated = { ...current, ...request, updatedAt: new Date().toISOString() };
  holders = holders.map(item => item.id === id ? updated : item);
  return mockResponse(updated);
}

export function addVehicleMock(id: string, request: VehicleRequest): Observable<VehicleResponse> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return notFound();
  if (existingPlate(request.plate)) return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const vehicle: VehicleResponse = { ...request, id: `v-${Date.now()}`, covered: false };
  holders = holders.map(item => item.id === id ? { ...item, vehicles: [...item.vehicles, vehicle], vehicleCount: item.vehicleCount + 1, updatedAt: new Date().toISOString() } : item);
  return mockResponse(vehicle);
}

export function updateVehicleMock(id: string, vehicleId: string, request: VehicleRequest): Observable<VehicleResponse> {
  const holder = holders.find(item => item.id === id);
  const current = holder?.vehicles.find(item => item.id === vehicleId);
  if (!holder || !current) return notFound();
  if (existingPlate(request.plate, vehicleId)) return mockError(409, 'La patente ya está registrada.', { plate: ['La patente ya está en uso.'] });
  const updated: VehicleResponse = { ...current, ...request };
  holders = holders.map(item => item.id === id ? { ...item, vehicles: item.vehicles.map(vehicle => vehicle.id === vehicleId ? updated : vehicle), updatedAt: new Date().toISOString() } : item);
  return mockResponse(updated);
}

export function deactivatePolicyholderMock(id: string): Observable<void> {
  const holder = holders.find(item => item.id === id);
  if (!holder) return notFound();
  if (holder.status === 'INACTIVE' || holder.activePolicyCount > 0) return mockError(422, 'No se puede dar de baja un asegurado con pólizas vigentes o que ya está de baja.');
  holders = holders.map(item => item.id === id ? { ...item, status: 'INACTIVE', updatedAt: new Date().toISOString() } : item);
  return mockResponse(undefined);
}
