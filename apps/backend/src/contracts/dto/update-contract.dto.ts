import { IsEnum } from 'class-validator';
import { ContractStatus } from '../contracts.store';

export class UpdateContractDto {
  @IsEnum(ContractStatus)
  status!: ContractStatus;
}
