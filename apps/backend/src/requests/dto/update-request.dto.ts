import { IsEnum } from 'class-validator';
import { RequestStatus } from '../requests.store';

export class UpdateRequestDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;
}
