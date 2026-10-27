import { Observable } from 'rxjs';
import { mockError, mockResponse } from '../../../core/http/mock-response';
import { Coverage, QuoteRequest, QuoteResponse, VehicleCatalogResponse } from '../models/quotes.models';

/** Datos simulados en memoria; se reemplazan al conectar el backend. */
const catalog: VehicleCatalogResponse = {
  vehicles: [
    { brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2022 },
    { brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2023 },
    { brand: 'Toyota', model: 'Yaris', version: 'XS 1.5', year: 2024 },
    { brand: 'Volkswagen', model: 'Polo', version: 'Highline 1.0 TSI', year: 2023 },
    { brand: 'Ford', model: 'Ranger', version: 'XLT 2.0', year: 2024 },
  ],
};

const coverages: Coverage[] = [
  'CIVIL_LIABILITY', 'COMPREHENSIVE_THIRD_PARTY',
  'COMPREHENSIVE_THIRD_PARTY_WITH_HAIL', 'ALL_RISK_WITH_DEDUCTIBLE',
];

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function calculate(request: QuoteRequest, number: string, createdAt: string, expiresOn: string): QuoteResponse {
  const insuredAmount = 24500000 + (request.year - 2022) * 1400000 + (request.brand === 'Ford' ? 6000000 : 0);
  const discounts = [
    ...(request.claimsLastThreeYears === 0 ? [{ code: 'NO_CLAIMS', percentage: 10 }] : []),
    ...(request.paymentMethod === 'AUTO_DEBIT' ? [{ code: 'AUTO_DEBIT', percentage: 5 }] : []),
  ];
  const discountRate = 1 - discounts.reduce((sum, item) => sum + item.percentage, 0) / 100;
  const risk = (request.use === 'COMMERCIAL' ? 1.2 : 1) * (request.gnc ? 1.08 : 1) *
    (1 + request.claimsLastThreeYears * 0.12);
  const rates = [0.00268, 0.00472, 0.00609, 0.00899];
  return {
    ...request, number, status: 'SAVED', createdAt, expiresOn, insuredAmount,
    coverages: coverages.map((coverage, index) => ({
      coverage, monthlyPremium: Math.round(insuredAmount * rates[index] * risk * discountRate),
    })),
    discounts,
  };
}

const exampleRequest: QuoteRequest = {
  brand: 'Toyota', model: 'Corolla', version: 'XEI 2.0 CVT', year: 2022,
  use: 'PERSONAL', gnc: false, postalCode: '1425', birthDate: '1986-08-14',
  licenseYears: 16, claimsLastThreeYears: 0, paymentMethod: 'AUTO_DEBIT', dni: '30123456',
};
let quotes: QuoteResponse[] = [calculate(exampleRequest, 'AUT-2026-08417', new Date().toISOString(), dateAfter(15))];
let nextNumber = 8418;

function validationErrors(request: QuoteRequest): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  if (!catalog.vehicles.some(vehicle => vehicle.brand === request.brand && vehicle.model === request.model &&
    vehicle.version === request.version && vehicle.year === request.year && request.year <= new Date().getFullYear())) {
    errors['year'] = ['Seleccioná un vehículo disponible del catálogo.'];
  }
  if (!/^[0-9]{4}$/.test(request.postalCode)) errors['postalCode'] = ['Ingresá cuatro dígitos.'];
  if (!/^[0-9]{7,8}$/.test(request.dni)) errors['dni'] = ['Ingresá siete u ocho dígitos.'];
  const birth = new Date(`${request.birthDate}T00:00:00`);
  if (!request.birthDate || !Number.isFinite(birth.getTime()) || birth.toISOString().slice(0, 10) !== request.birthDate || birth >= new Date()) {
    errors['birthDate'] = ['Ingresá una fecha de nacimiento válida y anterior a hoy.'];
  }
  const age = Number.isFinite(birth.getTime()) ? (new Date().getTime() - birth.getTime()) / 31557600000 : 0;
  if (!Number.isInteger(request.licenseYears) || request.licenseYears < 0 || request.licenseYears > age) {
    errors['licenseYears'] = ['Revisá los años de registro.'];
  }
  if (!Number.isInteger(request.claimsLastThreeYears) || request.claimsLastThreeYears < 0) {
    errors['claimsLastThreeYears'] = ['Ingresá un número entero no negativo.'];
  }
  if (!['PERSONAL', 'COMMERCIAL'].includes(request.use)) errors['use'] = ['Seleccioná un uso.'];
  if (!['AUTO_DEBIT', 'OTHER'].includes(request.paymentMethod)) errors['paymentMethod'] = ['Seleccioná un medio de pago.'];
  return errors;
}

export function getVehicleCatalogMock(): Observable<VehicleCatalogResponse> {
  return mockResponse(catalog);
}

export function createQuoteMock(request: QuoteRequest): Observable<QuoteResponse> {
  const errors = validationErrors(request);
  if (Object.keys(errors).length) return mockError(422, 'Revisá los datos indicados para cotizar', errors);
  const year = new Date().getFullYear();
  const quote = calculate(request, `AUT-${year}-${String(nextNumber++).padStart(5, '0')}`, new Date().toISOString(), dateAfter(15));
  quotes = [quote, ...quotes];
  return mockResponse(quote);
}

export function updateQuoteMock(number: string, request: QuoteRequest): Observable<QuoteResponse> {
  const previous = quotes.find(item => item.number === number);
  if (!previous) return mockError(404, 'No encontramos una cotización con esos datos');
  if (previous.expiresOn < dateAfter(0)) return mockError(410, 'La cotización venció. Realizá una nueva cotización');
  const errors = validationErrors(request);
  if (Object.keys(errors).length) return mockError(422, 'Revisá los datos indicados para cotizar', errors);
  const updated = calculate(request, number, previous.createdAt, previous.expiresOn);
  quotes = quotes.map(item => item.number === number ? updated : item);
  return mockResponse(updated);
}

export function recoverQuoteMock(number: string, dni: string): Observable<QuoteResponse> {
  if (!number.trim() || !/^[0-9]{7,8}$/.test(dni)) return mockError(422, 'Revisá los datos indicados para recuperar la cotización');
  const quote = quotes.find(item => item.number === number.trim() && item.dni === dni);
  if (!quote) return mockError(404, 'No encontramos una cotización con esos datos');
  if (quote.expiresOn < dateAfter(0)) return mockError(410, 'La cotización venció. Realizá una nueva cotización');
  return mockResponse(quote);
}
