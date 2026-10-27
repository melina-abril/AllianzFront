import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { Page, toPage } from '../../../shared/models/page';
import { CoverageResponse, CoverageType, DiscountResponse, QuoteRequest, QuoteResponse, VehicleFilters, VehicleResponse } from '../models/quotes.models';

/** Datos simulados en memoria; se reemplazan al conectar el backend. */
const vehicles: VehicleResponse[] = [
  { id: 'v-1', brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2022, insuredValue: 24500000 },
  { id: 'v-2', brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2023, insuredValue: 27800000 },
  { id: 'v-3', brand: 'Toyota', model: 'Yaris', version: 'XS 1.5', year: 2021, insuredValue: 16800000 },
  { id: 'v-4', brand: 'Volkswagen', model: 'Polo', version: 'Comfortline 1.6', year: 2022, insuredValue: 19700000 },
  { id: 'v-5', brand: 'Ford', model: 'Ranger', version: 'XLT 2.0', year: 2024, insuredValue: 42000000 }
];
const coverageNames: readonly { type: CoverageType; name: string; factor: number }[] = [
  { type: 'CIVIL_LIABILITY', name: 'Responsabilidad Civil', factor: 0.0018 },
  { type: 'COMPREHENSIVE_THIRD_PARTY', name: 'Terceros Completo', factor: 0.0032 },
  { type: 'COMPREHENSIVE_THIRD_PARTY_HAIL', name: 'Terceros Completo con Granizo', factor: 0.0038 },
  { type: 'ALL_RISK_WITH_DEDUCTIBLE', name: 'Todo Riesgo con franquicia', factor: 0.0054 }
];
let quotes: QuoteResponse[] = [];
let sequence = 8417;

export function listQuotableVehiclesMock(filters: VehicleFilters): Observable<Page<VehicleResponse>> {
  return mockResponse(toPage(vehicles.filter(v =>
    (!filters.brand || v.brand === filters.brand) && (!filters.model || v.model === filters.model) &&
    (!filters.version || v.version === filters.version) && (filters.year === undefined || v.year === filters.year)
  ), filters.page, filters.size));
}

function validate(request: QuoteRequest): VehicleResponse | null {
  return vehicles.find(v => v.brand === request.brand && v.model === request.model && v.version === request.version && v.year === request.year) ?? null;
}

function calculate(request: QuoteRequest, vehicle: VehicleResponse, id: string, createdAt: string, expiresOn: string): QuoteResponse {
  const discounts: DiscountResponse[] = [];
  if (request.claimsLastThreeYears === 0) discounts.push({ type: 'NO_CLAIMS', name: 'Sin siniestros en los últimos 3 años', rate: 0.10 });
  if (request.paymentMethod === 'AUTOMATIC_DEBIT') discounts.push({ type: 'AUTOMATIC_DEBIT', name: 'Pago con débito automático', rate: 0.05 });
  const rate = discounts.reduce((sum, discount) => sum + discount.rate, 0);
  const multiplier = (request.use === 'COMMERCIAL' ? 1.18 : 1) * (request.gnc ? 1.08 : 1) * (request.claimsLastThreeYears > 0 ? 1 + request.claimsLastThreeYears * 0.08 : 1);
  const coverages: CoverageResponse[] = coverageNames.map(({ type, name, factor }) => ({ type, name, monthlyPremium: Math.round(vehicle.insuredValue * factor * multiplier * (1 - rate) * 100) / 100 }));
  return { id, number: id, status: 'SAVED', vehicle, use: request.use, gnc: request.gnc, postalCode: request.postalCode, birthDate: request.birthDate, registrationYears: request.registrationYears, claimsLastThreeYears: request.claimsLastThreeYears, paymentMethod: request.paymentMethod, dni: request.dni, insuredAmount: vehicle.insuredValue, coverages, discounts, createdAt, updatedAt: new Date().toISOString(), expiresOn };
}

export function createQuoteMock(request: QuoteRequest): Observable<QuoteResponse> {
  const vehicle = validate(request);
  if (!vehicle) return mockError(422, 'No hay vehículos disponibles para esta selección', { year: ['Elegí una combinación del catálogo.'] });
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 15);
  const id = `AUT-${now.getFullYear()}-${String(sequence++).padStart(5, '0')}`;
  const quote = calculate(request, vehicle, id, now.toISOString(), expires.toISOString().slice(0, 10));
  quotes = [quote, ...quotes];
  return mockResponse(quote);
}

export function updateQuoteMock(id: string, request: QuoteRequest): Observable<QuoteResponse> {
  const current = quotes.find(q => q.id === id);
  if (!current) return mockError(404, 'No encontramos una cotización con esos datos');
  if (current.expiresOn < new Date().toISOString().slice(0, 10)) return mockError(422, 'La cotización venció. Realizá una nueva cotización');
  const vehicle = validate(request);
  if (!vehicle) return mockError(422, 'No hay vehículos disponibles para esta selección', { year: ['Elegí una combinación del catálogo.'] });
  const updated = calculate(request, vehicle, id, current.createdAt, current.expiresOn);
  quotes = quotes.map(q => q.id === id ? updated : q);
  return mockResponse(updated);
}

export function retrieveQuoteMock(id: string, dni: string): Observable<QuoteResponse> {
  const quote = quotes.find(q => q.id === id && q.dni === dni);
  if (!quote) return mockError(404, 'No encontramos una cotización con esos datos');
  if (quote.expiresOn < new Date().toISOString().slice(0, 10)) return mockError(422, 'La cotización venció. Realizá una nueva cotización');
  return mockResponse(quote);
}
