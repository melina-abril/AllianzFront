export type VehicleUse = 'PRIVATE' | 'COMMERCIAL';
export type PaymentMethod = 'AUTOMATIC_DEBIT' | 'OTHER';
export type CoverageType = 'CIVIL_LIABILITY' | 'COMPREHENSIVE_THIRD_PARTY' | 'COMPREHENSIVE_THIRD_PARTY_HAIL' | 'ALL_RISK_WITH_DEDUCTIBLE';
export type DiscountType = 'NO_CLAIMS' | 'AUTOMATIC_DEBIT';

export interface VehicleResponse {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  insuredValue: number;
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
  registrationYears: number;
  claimsLastThreeYears: number;
  paymentMethod: PaymentMethod;
  dni: string;
}

export interface CoverageResponse {
  type: CoverageType;
  name: string;
  monthlyPremium: number;
}

export interface DiscountResponse {
  type: DiscountType;
  name: string;
  rate: number;
}

export interface QuoteResponse {
  id: string;
  number: string;
  status: string;
  vehicle: VehicleResponse;
  use: VehicleUse;
  gnc: boolean;
  postalCode: string;
  birthDate: string;
  registrationYears: number;
  claimsLastThreeYears: number;
  paymentMethod: PaymentMethod;
  dni: string;
  insuredAmount: number;
  coverages: CoverageResponse[];
  discounts: DiscountResponse[];
  createdAt: string;
  updatedAt: string;
  expiresOn: string;
}

export interface VehicleFilters {
  brand?: string;
  model?: string;
  version?: string;
  year?: number;
  page: number;
  size: number;
}
