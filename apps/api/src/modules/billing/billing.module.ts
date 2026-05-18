import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WalletEntity } from './entities/wallet.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { PayoutEntity } from './entities/payout.entity';
import { WalletService } from './wallet.service';
import { BillingEngineService } from './billing-engine.service';
import { RazorpayService } from './razorpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([WalletEntity, TransactionEntity, PayoutEntity]), ConfigModule],
  providers: [WalletService, BillingEngineService, RazorpayService],
  exports: [WalletService, BillingEngineService, RazorpayService],
})
export class BillingModule {}
