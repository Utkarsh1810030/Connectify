import { Controller, Get, Post, Body, Query, UseGuards, Req, Headers, BadRequestException } from '@nestjs/common';
import { IsNumber, IsString, Min } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WalletService } from './wallet.service';
import { RazorpayService } from './razorpay.service';

class CreateOrderDto {
  @IsNumber() @Min(100) amount!: number;
}

class VerifyPaymentDto {
  @IsString() orderId!: string;
  @IsString() paymentId!: string;
  @IsString() signature!: string;
  @IsNumber() @Min(1) amount!: number;
}

@Controller('billing')
export class BillingController {
  constructor(
    private readonly walletService: WalletService,
    private readonly razorpayService: RazorpayService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  async getWallet(@CurrentUser() user: { id: string }) {
    const balance = await this.walletService.getBalance(user.id);
    return { balance, currency: 'INR' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  getTransactions(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getTransactions(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('topup/order')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.razorpayService.createOrder(dto.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Post('topup/verify')
  async verifyPayment(
    @CurrentUser() user: { id: string },
    @Body() dto: VerifyPaymentDto,
  ) {
    const valid = this.razorpayService.verifyPaymentSignature(dto.orderId, dto.paymentId, dto.signature);
    if (!valid) throw new BadRequestException('Invalid payment signature');
    await this.walletService.topUp(user.id, dto.amount, dto.paymentId);
    const balance = await this.walletService.getBalance(user.id);
    return { success: true, balance };
  }

  // No auth guard — Razorpay calls this directly
  @Post('webhook/razorpay')
  async razorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.razorpayService.handleWebhook(req.body, signature);
    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('payout/request')
  requestPayout(
    @CurrentUser() user: { id: string },
    @Body('amount') amount: number,
  ) {
    return this.walletService.requestPayout(user.id, amount);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payouts')
  getPayouts(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletService.getPayouts(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
