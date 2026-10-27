import { BadgeTone } from '../../../shared/components/status-badge';

/** Tipos de las respuestas utilizadas por PolicyholderController. */
export type PersonType = 'INDIVIDUAL' | 'LEGAL_ENTITY';
export type PolicyholderStatus = 'ACTIVE' | 'INACTIVE';

export interface VehicleResponse {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  engineNumber: string;
  chassisNumber: string;
  covered: boolean;
}

export interface PolicyResponse {
  number: string;
  status: string;
  coverageDescription: string;
  vehicleIds: string[];
  startDate: string;
  endDate: string;
}

export interface ClaimResponse {
  number: string;
  status: string;
  vehicleId: string;
  vehiclePlate: string;
  reason: string;
  reportedDate: string;
}

export interface PolicyholderResponse {
  id: string;
  personType: PersonType;
  name: string;
  documentNumber: string;
  status: PolicyholderStatus;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vehicleCount: number;
  activePolicyCount: number;
  vehicles: VehicleResponse[];
  policies: PolicyResponse[];
  claims: ClaimResponse[];
  updatedAt: string;
}

export interface PolicyholderRequest {
  personType: PersonType;
  name: string;
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
  engineNumber: string;
  chassisNumber: string;
}

export interface PolicyholderFilters {
  search: string;
  page: number;
  size: number;
}

export const POLICYHOLDER_STATUS: Record<PolicyholderStatus, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Activo', tone: 'success' },
  INACTIVE: { label: 'De baja', tone: 'neutral' },
};

export const POLICY_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  ACTIVE: { label: 'Vigente', tone: 'success' },
  EXPIRED: { label: 'Vencida', tone: 'warning' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' },
};

export const CLAIM_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  REPORTED: { label: 'Denunciado', tone: 'info' },
  IN_REVIEW: { label: 'En revisión', tone: 'warning' },
  CLOSED: { label: 'Cerrado', tone: 'neutral' },
};
