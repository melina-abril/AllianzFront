import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { Page, toPage } from '../../../shared/models/page';
import { CoverageResponse, CoverageType, DiscountResponse, QuoteRequest, QuoteResponse, VehicleFilters, VehicleResponse } from '../models/quotes.models';

/** Datos de demostración en memoria; se reemplazan al conectar el backend. */
const vehicles: VehicleResponse[] = [
  { id: 'veh-1', brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2022, insuredValue: 24500000 },
  { id: 'veh-2', brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2023, insuredValue: 27900000 },
  { id: 'veh-3', brand: 'Toyota', model: 'Yaris', version: 'XS 1.5', year: 2023, insuredValue: 19200000 },
  { id: 'veh-4', brand: 'Ford', model: 'Ranger', version: 'XLT 2.0', year: 2024, insuredValue: 39800000 },
  { id: 'veh-5', brand: 'Volkswagen', model: 'Polo', version: 'Highline 1.0', year: 2022, insuredValue: 20500000 },
];
const coverageOptions: readonly { type: CoverageType; name: string; factor: number }[] = [
  { type: 'CIVIL_LIABILITY', name: 'Responsabilidad Civil', factor: 0.0018 },
  { type: 'COMPREHENSIVE_THIRD_PARTY', name: 'Terceros Completo', factor: 0.0032 },
  { type: 'COMPREHENSIVE_THIRD_PARTY_HAIL', name: 'Terceros Completo con Granizo', factor: 0.0038 },
  { type: 'ALL_RISK_WITH_DEDUCTIBLE', name: 'Todo Riesgo con franquicia', factor: 0.0054 },
];
let quotes: QuoteResponse[] = [];
let nextNumber = 8417;

export function listQuotableVehiclesMock(filters: VehicleFilters): Observable<Page<VehicleResponse>> {
  return mockResponse(toPage(vehicles.filter(vehicle =>
    (!filters.brand || vehicle.brand === filters.brand) &&
    (!filters.model || vehicle.model === filters.model) &&
    (!filters.version || vehicle.version === filters.version) &&
    (filters.year === undefined || vehicle.year === filters.year),
  ), filters.page, filters.size));
}

function calculate(request: QuoteRequest, previous?: QuoteResponse): Observable<QuoteResponse> {
  const vehicle = vehicles.find(option => option.brand === request.brand && option.model === request.model &&
    option.version === request.version && option.year === request.year);
  if (!vehicle) return mockError(422, 'No hay vehículos disponibles para esta selección', { year: ['Seleccioná un vehículo del catálogo.'] });
  if (!/^\d{4}$/.test(request.postalCode) || !/^\d{7,8}$/.test(request.dni)) {
    return mockError(422, 'Revisá los datos indicados para cotizar', {
      ...(!/^\d{4}$/.test(request.postalCode) ? { postalCode: ['Ingresá cuatro dígitos.'] } : {}),
      ...(!/^\d{7,8}$/.test(request.dni) ? { dni: ['Ingresá siete u ocho dígitos.'] } : {}),
    });
  }
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 15);
  const discounts: DiscountResponse[] = [];
  if (request.claimsLastThreeYears === 0) discounts.push({ type: 'NO_CLAIMS', name: 'Sin siniestros en los últimos 3 años', rate: 0.10 });
  if (request.paymentMethod === 'AUTOMATIC_DEBIT') discounts.push({ type: 'AUTOMATIC_DEBIT', name: 'Pago con débito automático', rate: 0.05 });
  const rate = discounts.reduce((total, discount) => total + discount.rate, 0);
  const coverages: CoverageResponse[] = coverageOptions.map(option => ({
    type: option.type, name: option.name,
    monthlyPremium: Math.round(vehicle.insuredValue * option.factor * (1 - rate) * 100) / 100,
  }));
  const id = previous?.id ?? `AUT-${today.getFullYear()}-${String(nextNumber++).padStart(5, '0')}`;
  const result: QuoteResponse = {
    id, number: id, status: 'SAVED', vehicle, use: request.use, gnc: request.gnc,
    postalCode: request.postalCode, birthDate: request.birthDate,
    registrationYears: request.registrationYears, claimsLastThreeYears: request.claimsLastThreeYears,
    paymentMethod: request.paymentMethod, dni: request.dni, insuredAmount: vehicle.insuredValue,
    coverages, discounts, createdAt: previous?.createdAt ?? today.toISOString(),
    updatedAt: today.toISOString(), expiresOn: previous?.expiresOn ?? expiry.toISOString().slice(0, 10),
  };
  quotes = previous ? quotes.map(item => item.id === id ? result : item) : [result, ...quotes];
  return mockResponse(result);
}

export function createQuoteMock(request: QuoteRequest): Observable<QuoteResponse> {
  return calculate(request);
}

export function updateQuoteMock(id: string, request: QuoteRequest): Observable<QuoteResponse> {
  const previous = quotes.find(item => item.id === id);
  if (!previous) return mockError(404, 'No encontramos una cotización con esos datos');
  if (previous.expiresOn < new Date().toISOString().slice(0, 10)) return mockError(422, 'La cotización venció. Realizá una nueva cotización');
  if (previous.dni !== request.dni) return mockError(422, 'El DNI de la cotización no se puede modificar.', { dni: ['Ingresá el DNI original.'] });
  return calculate(request, previous);
}

export function retrieveQuoteMock(id: string, dni: string): Observable<QuoteResponse> {
  const result = quotes.find(item => item.id === id && item.dni === dni);
  if (!result) return mockError(404, 'No encontramos una cotización con esos datos');
  if (result.expiresOn < new Date().toISOString().slice(0, 10)) return mockError(422, 'La cotización venció. Realizá una nueva cotización');
  return mockResponse(result);
}
