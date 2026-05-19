import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SessionsService } from '../sessions/sessions.service';

const mockChatService = {
  getOrCreateConversation: jest.fn(),
  getMessages: jest.fn(),
};

const mockSessionsService = {
  findById: jest.fn(),
};

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: SessionsService, useValue: mockSessionsService },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    jest.clearAllMocks();
  });

  describe('getOrCreate', () => {
    it('looks up session then creates conversation with both participant IDs', async () => {
      const session = { id: 'sess1', userId: 'user1', providerId: 'prov1' };
      const conversation = { _id: 'conv1', sessionId: 'sess1' };
      mockSessionsService.findById.mockResolvedValue(session);
      mockChatService.getOrCreateConversation.mockResolvedValue(conversation);

      const result = await controller.getOrCreate({ id: 'user1' }, 'sess1');

      expect(mockSessionsService.findById).toHaveBeenCalledWith('sess1');
      expect(mockChatService.getOrCreateConversation).toHaveBeenCalledWith('sess1', ['user1', 'prov1']);
      expect(result).toBe(conversation);
    });
  });

  describe('getMessages', () => {
    it('fetches messages with default pagination when no query params', () => {
      mockChatService.getMessages.mockResolvedValue({ data: [] });
      controller.getMessages('conv1');
      expect(mockChatService.getMessages).toHaveBeenCalledWith('conv1', { page: undefined, limit: undefined });
    });

    it('parses page and limit as integers', () => {
      mockChatService.getMessages.mockResolvedValue({ data: [] });
      controller.getMessages('conv1', '2', '50');
      expect(mockChatService.getMessages).toHaveBeenCalledWith('conv1', { page: 2, limit: 50 });
    });
  });
});
