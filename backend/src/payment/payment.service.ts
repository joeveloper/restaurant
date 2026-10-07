import { Injectable } from '@nestjs/common';

export interface PaymentResult {
  success: boolean;
}

/** Simulated payment provider. Replace the bodies with a real provider later. */
@Injectable()
export class PaymentService {
  async authorizePayment(_amount: number): Promise<PaymentResult> {
    return { success: true };
  }

  async refundPayment(_amount: number): Promise<PaymentResult> {
    return { success: true };
  }
}
