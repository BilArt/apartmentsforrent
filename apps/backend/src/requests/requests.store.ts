export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export type BookingRequest = {
  id: string;
  listingId: string;
  tenantId: string;
  status: RequestStatus;

  message?: string;
  from?: string;
  to?: string;

  createdAt: string;
};

export const requests: BookingRequest[] = [];
