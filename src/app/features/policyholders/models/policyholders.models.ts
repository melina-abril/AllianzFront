import { BadgeTone } from '../../../shared/components/status-badge';

/** Tipos de los DTO utilizados por PolicyholderController. */
export type PersonType = 'INDIVIDUAL' | 'LEGAL_ENTITY';
export type PolicyholderStatus = 'ACTIVE' | 'INACTIVE';
export type DocumentType = 'DNI' | 'CUIT';

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  engineNumber: string;
  chassisNumber: string;
  covered: boolean;
}

export interface PolicySummary {
  number: string;
  status: string;
  coverageDescription: string;
  vehicleIds: string[];
  startDate: string;
  endDate: string;
}

export interface ClaimSummary {
  number: string;
  status: string;
  vehicleId: string;
  vehiclePlate: string;
  reason: string;
  reportedDate: string;
}

export interface Policyholder {
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
  vehicles: Vehicle[];
  policies: PolicySummary[];
  claims: ClaimSummary[];
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
  INACTIVE: { label: 'Baja', tone: 'neutral' },
};

export const PERSON_TYPE: Record<PersonType, string> = {
  INDIVIDUAL: 'Persona física',
  LEGAL_ENTITY: 'Persona jurídica',
};

export function documentType(personType: PersonType): DocumentType {
  return personType === 'INDIVIDUAL' ? 'DNI' : 'CUIT';
}

export function policyStatus(status: string): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'ACTIVE': return { label: 'Vigente', tone: 'success' };
    case 'EXPIRED': return { label: 'Vencida', tone: 'warning' };
    case 'CANCELLED': return { label: 'Cancelada', tone: 'danger' };
    default: return { label: status, tone: 'neutral' };
  }
}

export function claimStatus(status: string): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'REPORTED': return { label: 'Denunciado', tone: 'info' };
    case 'IN_REVIEW': return { label: 'En trámite', tone: 'warning' };
    case 'CLOSED': return { label: 'Cerrado', tone: 'success' };
    default: return { label: status, tone: 'neutral' };
  }
}
