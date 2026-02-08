import { IsEnum } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class UpdateContractDto {
  @IsEnum(ContractStatus)
  status!: ContractStatus;
}
