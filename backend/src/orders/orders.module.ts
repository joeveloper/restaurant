import { Module } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({ controllers: [OrdersController], providers: [OrdersService, PaymentService] })
export class OrdersModule {}
