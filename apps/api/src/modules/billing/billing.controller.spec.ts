import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { WalletService } from './wallet.service';
import { RazorpayService } from './razorpay.service';

const mockWalletService = {
  getBalance: jest.fn(),
  getTransactions: jest.fn(),
  topUp: jest.fn(),
  requestPayout: jest.fn(),
  getPayouts: jest.fn(),
};

const mockRazorpayService = {
  createOrder: jest.fn(),
  verifyPaymentSignature: jest.fn(),
  handleWebhook: jest.fn(),
};

const mockUser = { id: 'user1' };

describe('BillingController', () => {
  let controller: BillingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: RazorpayService, useValue: mockRazorpayService },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    jest.clearAllMocks();
  });

  describe('getWallet', () => {
    it('returns balance and currency INR', async () => {
      mockWalletService.getBalance.mockResolvedValue(500);
      const result = await controller.getWallet(mockUser);
      expect(result).toEqual({ balance: 500, currency: 'INR' });
    });
  });

  describe('getTransactions', () => {
    it('delegates with parsed pagination', () => {
      controller.getTransactions(mockUser, '2', '10');
      expect(mockWalletService.getTransactions).toHaveBeenCalledWith('user1', { page: 2, limit: 10 });
    });
  });

  describe('createOrder', () => {
    it('delegates amount to razorpayService', () => {
      mockRazorpayService.createOrder.mockResolvedValue({ id: 'order1' });
      controller.createOrder({ amount: 500 } as any);
      expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(500);
    });
  });

  describe('verifyPayment', () => {
    it('throws BadRequestException when signature invalid', async () => {
      mockRazorpayService.verifyPaymentSignature.mockReturnValue(false);
      await expect(
        controller.verifyPayment(mockUser, { orderId: 'o1', paymentId: 'p1', signature: 'bad', amount: 500 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('tops up wallet and returns new balance on valid signature', async () => {
      mockRazorpayService.verifyPaymentSignature.mockReturnValue(true);
      mockWalletService.topUp.mockResolvedValue(undefined);
      mockWalletService.getBalance.mockResolvedValue(600);

      const result = await controller.verifyPayment(mockUser, {
        orderId: 'o1', paymentId: 'p1', signature: 'valid', amount: 100,
      } as any);

      expect(mockWalletService.topUp).toHaveBeenCalledWith('user1', 100, 'p1');
      expect(result).toEqual({ success: true, balance: 600 });
    });
  });

  describe('requestPayout', () => {
    it('delegates to walletService.requestPayout', () => {
      mockWalletService.requestPayout.mockResolvedValue({ id: 'payout1' });
      controller.requestPayout(mockUser, 200);
      expect(mockWalletService.requestPayout).toHaveBeenCalledWith('user1', 200);
    });
  });

  describe('getPayouts', () => {
    it('delegates with parsed pagination', () => {
      controller.getPayouts(mockUser, '1', '5');
      expect(mockWalletService.getPayouts).toHaveBeenCalledWith('user1', { page: 1, limit: 5 });
    });
  });
});
