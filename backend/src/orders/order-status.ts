export enum OrderStatus {
  PLACED = 'PLACED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  PICKED_UP = 'PICKED_UP',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
}

export enum PaymentStatus {
  AUTHORIZED = 'AUTHORIZED',
  REFUNDED = 'REFUNDED',
}

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.REJECTED]: [],
};
