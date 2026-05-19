import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotificationsService, FIREBASE_APP } from './notifications.service';
import { UserEntity } from '../users/entities/user.entity';

const mockUserRepo = { findOne: jest.fn() };
const mockConfigService = { get: jest.fn() };
const mockFirebaseApp = {
  messaging: jest.fn().mockReturnValue({ send: jest.fn().mockResolvedValue('msg-id') }),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  function buildModule(isDev: boolean, firebaseApp: any) {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return isDev ? 'development' : 'production';
      return null;
    });
    return Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
        { provide: FIREBASE_APP, useValue: firebaseApp },
      ],
    }).compile();
  }

  afterEach(() => jest.clearAllMocks());

  describe('dev mode', () => {
    beforeEach(async () => {
      const module: TestingModule = await buildModule(true, mockFirebaseApp);
      service = module.get<NotificationsService>(NotificationsService);
    });

    it('logs and returns without calling FCM in dev', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await service.sendPush('user1', 'Hello', 'World');
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockFirebaseApp.messaging).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('production mode', () => {
    beforeEach(async () => {
      const module: TestingModule = await buildModule(false, mockFirebaseApp);
      service = module.get<NotificationsService>(NotificationsService);
    });

    it('does nothing when user has no FCM token', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user1', fcmToken: null });
      await service.sendPush('user1', 'Title', 'Body');
      expect(mockFirebaseApp.messaging().send).not.toHaveBeenCalled();
    });

    it('sends FCM message when user has token', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 'user1', fcmToken: 'fcm-token-abc' });
      const sendMock = jest.fn().mockResolvedValue('msg-id');
      mockFirebaseApp.messaging.mockReturnValue({ send: sendMock });

      await service.sendPush('user1', 'Title', 'Body', { type: 'test' });
      expect(sendMock).toHaveBeenCalledWith({
        token: 'fcm-token-abc',
        notification: { title: 'Title', body: 'Body' },
        data: { type: 'test' },
      });
    });

    it('does nothing when firebaseApp is null', async () => {
      const module: TestingModule = await buildModule(false, null);
      const noFcbService = module.get<NotificationsService>(NotificationsService);
      await expect(noFcbService.sendPush('user1', 'T', 'B')).resolves.toBeUndefined();
    });

    it('notifyLowBalance calls sendPush with correct message', async () => {
      const spy = jest.spyOn(service, 'sendPush').mockResolvedValue();
      await service.notifyLowBalance('user1', 25);
      expect(spy).toHaveBeenCalledWith('user1', 'Low Balance', expect.stringContaining('₹25'), { type: 'low_balance' });
    });

    it('notifySessionEnded formats minutes correctly', async () => {
      const spy = jest.spyOn(service, 'sendPush').mockResolvedValue();
      await service.notifySessionEnded('user1', 125, 50);
      expect(spy).toHaveBeenCalledWith('user1', 'Session Ended', expect.stringContaining('2 min'), { type: 'session_ended' });
    });
  });
});
