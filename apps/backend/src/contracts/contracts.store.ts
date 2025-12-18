export enum ContractStatus {
  DRAFT = 'DRAFT',
  SIGNED = 'SIGNED',
  CANCELLED = 'CANCELLED',
}

export type Contract = {
  id: string;
  requestId: string;
  listingId: string;

  ownerId: string;
  tenantId: string;

  price: number;

  from?: string;
  to?: string;

  status: ContractStatus;
  createdAt: string;
};

export const contracts: Contract[] = [];
