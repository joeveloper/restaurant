import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PaymentService } from '../payment/payment.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ALLOWED_TRANSITIONS, OrderStatus, PaymentStatus } from './order-status';

@Injectable()
export class OrdersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly payment: PaymentService,
  ) {}

  async findAll() {
    return (await this.database.readDb()).orders;
  }

  async findOne(id: string) {
    const order = (await this.database.readDb()).orders.find((o) => o.id === id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  create(dto: CreateOrderDto) {
    return this.database.update(async (db) => {
      const restaurant = db.restaurants.find((r) => r.id === dto.restaurantId);
      if (!restaurant || !restaurant.isOpen) {
        throw new BadRequestException('Restaurant not available');
      }

      let total = 0;
      const items = dto.items.map((line) => {
        const menuItem = db.menuItems.find(
          (m) => m.id === line.menuItemId && m.restaurantId === dto.restaurantId && m.available,
        );
        if (!menuItem) throw new BadRequestException(`Invalid menu item: ${line.menuItemId}`);
        total += menuItem.price * line.quantity;
        return { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: line.quantity };
      });
      total = Math.round(total * 100) / 100;

      const auth = await this.payment.authorizePayment(total);
      if (!auth.success) {
        throw new BadRequestException('Payment failed. Order was not placed.');
      }

      const now = new Date().toISOString();
      const order = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        customerId: dto.customerId,
        restaurantId: dto.restaurantId,
        items,
        total,
        paymentStatus: PaymentStatus.AUTHORIZED,
        status: OrderStatus.PLACED,
        statusHistory: [{ status: OrderStatus.PLACED, timestamp: now }],
        createdAt: now,
        updatedAt: now,
      };
      db.orders.push(order);
      return order;
    });
  }

  accept(id: string) {
    return this.transition(id, OrderStatus.ACCEPTED);
  }

  reject(id: string) {
    return this.transition(id, OrderStatus.REJECTED);
  }

  updateStatus(id: string, status: OrderStatus) {
    // accept/reject have dedicated endpoints
    if (status === OrderStatus.ACCEPTED || status === OrderStatus.REJECTED) {
      throw new BadRequestException(`Use the dedicated endpoint to set status ${status}`);
    }
    return this.transition(id, status);
  }

  private transition(id: string, next: OrderStatus) {
    return this.database.update(async (db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) throw new NotFoundException('Order not found');
      if (!ALLOWED_TRANSITIONS[order.status as OrderStatus].includes(next)) {
        throw new BadRequestException(`Invalid transition: ${order.status} → ${next}`);
      }

      const now = new Date().toISOString();
      order.status = next;
      order.statusHistory.push({ status: next, timestamp: now });

      if (next === OrderStatus.REJECTED) {
        const refund = await this.payment.refundPayment(order.total);
        if (!refund.success) throw new BadRequestException('Refund failed');
        order.paymentStatus = PaymentStatus.REFUNDED;
        order.statusHistory.push({ status: PaymentStatus.REFUNDED, timestamp: now });
      }
      order.updatedAt = now;
      return order;
    });
  }
}
