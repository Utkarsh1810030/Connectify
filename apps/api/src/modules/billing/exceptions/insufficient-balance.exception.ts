import { HttpException, HttpStatus } from '@nestjs/common';
export class InsufficientBalanceException extends HttpException {
  constructor() {
    super('Insufficient wallet balance', HttpStatus.PAYMENT_REQUIRED);
  }
}
