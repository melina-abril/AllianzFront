import { BadgeTone } from '../../../shared/components/status-badge';
import { Page } from '../../../shared/models/page';

export type PersonType = 'NATURAL' | 'LEGAL';
export type DocumentType = 'DNI' | 'CUIT';
export type PolicyholderStatus = 'ACTIVE' | 'INACTIVE';
export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ClaimStatus = 'REPORTED' | 'IN_REVIEW' | 'CLOSED';

export interface PolicyholderResponse {
  id: string;
  name: string;
  personType: PersonType;
  documentType: DocumentType;
  documentNumber: string;
  status: PolicyholderStatus;
}

export interface PolicyholderRequest {
  personType: PersonType;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
}

export interface VehicleRequest {
  plate: string;
  brand: string;
  model: string;
  year: number;
  engine: string;
  chassis: string;
}

export interface VehicleResponse extends VehicleRequest {
  id: string;
  covered: boolean;
}

export interface PolicySummaryResponse {
  number: string;
  status: PolicyStatus;
  coverageDescription: string;
  vehiclePlates: string[];
  startDate: string;
  endDate: string;
}

export interface ClaimSummaryResponse {
  number: string;
  status: ClaimStatus;
  vehiclePlate: string | null;
  reason: string;
  reportedDate: string;
}

export interface PolicyholderDetailResponse extends PolicyholderResponse {
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vehicleCount: number;
  activePolicyCount: number;
  vehicles: VehicleResponse[];
  policies: PolicySummaryResponse[];
  claims: ClaimSummaryResponse[];
}

export interface PolicyholderFilters {
  search: string;
  page: number;
  size: number;
}

export type PolicyholderPage = Page<PolicyholderResponse>;

export const POLICYHOLDER_STATUS: Record<PolicyholderStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Activo', tone: 'success' },
  INACTIVE: { label: 'De baja', tone: 'neutral' },
};
export const POLICY_STATUS: Record<PolicyStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Vigente', tone: 'success' },
  EXPIRED: { label: 'Vencida', tone: 'warning' },
  CANCELLED: { label: 'Cancelada', tone: 'danger' },
};
export const CLAIM_STATUS: Record<ClaimStatus, { label: string; tone: BadgeTone }> = {
  REPORTED: { label: 'Denunciado', tone: 'info' },
  IN_REVIEW: { label: 'En revisión', tone: 'warning' },
  CLOSED: { label: 'Cerrado', tone: 'neutral' },
};
