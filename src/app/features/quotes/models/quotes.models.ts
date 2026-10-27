export type VehicleUse = 'PERSONAL' | 'COMMERCIAL';
export type PaymentMethod = 'AUTO_DEBIT' | 'OTHER';
export type Coverage = 'CIVIL_LIABILITY' | 'COMPREHENSIVE_THIRD_PARTY' | 'COMPREHENSIVE_THIRD_PARTY_WITH_HAIL' | 'ALL_RISK_WITH_DEDUCTIBLE';

export interface VehicleOptionResponse {
  brand: string;
  model: string;
  version: string;
  year: number;
}

export interface VehicleCatalogResponse {
  vehicles: VehicleOptionResponse[];
}

export interface QuoteRequest {
  brand: string;
  model: string;
  version: string;
  year: number;
  use: VehicleUse;
  gnc: boolean;
  postalCode: string;
  birthDate: string;
  licenseYears: number;
  claimsLastThreeYears: number;
  paymentMethod: PaymentMethod;
  dni: string;
}

export interface CoverageResponse {
  coverage: Coverage;
  monthlyPremium: number;
}

export interface DiscountResponse {
  code: string;
  percentage: number;
}

export interface QuoteResponse extends QuoteRequest {
  number: string;
  status: string;
  createdAt: string;
  expiresOn: string;
  insuredAmount: number;
  coverages: CoverageResponse[];
  discounts: DiscountResponse[];
}

export const COVERAGE_LABELS: Record<Coverage, string> = {
  CIVIL_LIABILITY: 'Responsabilidad Civil',
  COMPREHENSIVE_THIRD_PARTY: 'Terceros Completo',
  COMPREHENSIVE_THIRD_PARTY_WITH_HAIL: 'Terceros Completo con Granizo',
  ALL_RISK_WITH_DEDUCTIBLE: 'Todo Riesgo con franquicia',
};

export const DISCOUNT_LABELS: Record<string, string> = {
  NO_CLAIMS: 'Sin siniestros en 3 años',
  AUTO_DEBIT: 'Pago con débito automático',
};
