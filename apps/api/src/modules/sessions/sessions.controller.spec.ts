import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

const mockSessionsService = {
  create: jest.fn(),
  start: jest.fn(),
  end: jest.fn(),
  getActive: jest.fn(),
  findByUser: jest.fn(),
  findByProvider: jest.fn(),
  findById: jest.fn(),
};

const mockUser = { id: 'user1' };

describe('SessionsController', () => {
  let controller: SessionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: mockSessionsService }],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    jest.clearAllMocks();
  });

  it('create delegates to sessionsService.create with userId', () => {
    const dto = { providerId: 'prov1', type: 'chat' as const };
    mockSessionsService.create.mockResolvedValue({ id: 'sess1' });
    controller.create(mockUser, dto);
    expect(mockSessionsService.create).toHaveBeenCalledWith('user1', dto);
  });

  it('start delegates to sessionsService.start', () => {
    controller.start('sess1', mockUser);
    expect(mockSessionsService.start).toHaveBeenCalledWith('sess1', 'user1');
  });

  it('end delegates to sessionsService.end with user_ended reason', () => {
    controller.end('sess1');
    expect(mockSessionsService.end).toHaveBeenCalledWith('sess1', 'user_ended');
  });

  it('getActive delegates to sessionsService.getActive', () => {
    controller.getActive(mockUser);
    expect(mockSessionsService.getActive).toHaveBeenCalledWith('user1');
  });

  it('list delegates with parsed pagination', () => {
    controller.list(mockUser, '2', '10');
    expect(mockSessionsService.findByUser).toHaveBeenCalledWith('user1', { page: 2, limit: 10 });
  });

  it('list passes undefined pagination when params absent', () => {
    controller.list(mockUser);
    expect(mockSessionsService.findByUser).toHaveBeenCalledWith('user1', { page: undefined, limit: undefined });
  });

  it('listAsProvider delegates to findByProvider', () => {
    controller.listAsProvider(mockUser, '1', '5');
    expect(mockSessionsService.findByProvider).toHaveBeenCalledWith('user1', { page: 1, limit: 5 });
  });

  it('findOne delegates to findById', () => {
    controller.findOne('sess1');
    expect(mockSessionsService.findById).toHaveBeenCalledWith('sess1');
  });
});
