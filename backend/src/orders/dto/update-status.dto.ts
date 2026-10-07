import { IsEnum } from 'class-validator';
import { OrderStatus } from '../order-status';

export class UpdateStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
