import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ModerationService } from '../moderation/moderation.service';
import { SessionsService } from '../sessions/sessions.service';
import { ProvidersService } from '../providers/providers.service';

const mockAdminService = {
  listUsers: jest.fn(),
  banUser: jest.fn(),
  unbanUser: jest.fn(),
  listProviders: jest.fn(),
  approveProvider: jest.fn(),
  listPayouts: jest.fn(),
  processPayout: jest.fn(),
};

const mockModerationService = {
  getReports: jest.fn(),
  updateReport: jest.fn(),
};

const mockSessionsService = {
  findAll: jest.fn(),
};

const mockProvidersService = {
  reviewKyc: jest.fn(),
};

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: ModerationService, useValue: mockModerationService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: ProvidersService, useValue: mockProvidersService },
      ],
    })
      .overrideGuard(require('../auth/guards/jwt-auth.guard').JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(require('../auth/guards/roles.guard').RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminController>(AdminController);
    jest.clearAllMocks();
  });

  it('listUsers delegates to adminService', () => {
    mockAdminService.listUsers.mockResolvedValue({ data: [] });
    controller.listUsers(1, 10, 'john');
    expect(mockAdminService.listUsers).toHaveBeenCalledWith({ page: 1, limit: 10, search: 'john' });
  });

  it('banUser delegates to adminService', () => {
    mockAdminService.banUser.mockResolvedValue({});
    controller.banUser('user1');
    expect(mockAdminService.banUser).toHaveBeenCalledWith('user1');
  });

  it('unbanUser delegates to adminService', () => {
    mockAdminService.unbanUser.mockResolvedValue({});
    controller.unbanUser('user1');
    expect(mockAdminService.unbanUser).toHaveBeenCalledWith('user1');
  });

  it('approveProvider delegates to adminService', () => {
    mockAdminService.approveProvider.mockResolvedValue({});
    controller.approveProvider('prov1');
    expect(mockAdminService.approveProvider).toHaveBeenCalledWith('prov1');
  });

  it('reviewKyc delegates to providersService with approved decision', async () => {
    const updated = { id: 'prov1', kycStatus: 'approved' };
    mockProvidersService.reviewKyc.mockResolvedValue(updated);
    const result = await controller.reviewKyc('prov1', 'approved');
    expect(mockProvidersService.reviewKyc).toHaveBeenCalledWith('prov1', 'approved', undefined);
    expect(result).toEqual(updated);
  });

  it('reviewKyc passes rejectionReason when rejecting', async () => {
    mockProvidersService.reviewKyc.mockResolvedValue({ id: 'prov1', kycStatus: 'rejected' });
    await controller.reviewKyc('prov1', 'rejected', 'Documents unclear');
    expect(mockProvidersService.reviewKyc).toHaveBeenCalledWith('prov1', 'rejected', 'Documents unclear');
  });

  it('listReports delegates to moderationService', () => {
    mockModerationService.getReports.mockResolvedValue({ data: [] });
    controller.listReports(1, 10, 'open');
    expect(mockModerationService.getReports).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'open' });
  });

  it('updateReport delegates to moderationService', async () => {
    const updated = { id: 'rep1', status: 'resolved' };
    mockModerationService.updateReport.mockResolvedValue(updated);
    const result = await controller.updateReport('rep1', 'resolved');
    expect(mockModerationService.updateReport).toHaveBeenCalledWith('rep1', 'resolved');
    expect(result).toEqual(updated);
  });

  it('listSessions delegates to sessionsService with parsed pagination', () => {
    mockSessionsService.findAll.mockResolvedValue({ data: [] });
    controller.listSessions('2', '5');
    expect(mockSessionsService.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it('processPayout delegates to adminService', () => {
    mockAdminService.processPayout.mockResolvedValue({});
    controller.processPayout('pay1', 'BANK_REF_123');
    expect(mockAdminService.processPayout).toHaveBeenCalledWith('pay1', 'BANK_REF_123');
  });
});
