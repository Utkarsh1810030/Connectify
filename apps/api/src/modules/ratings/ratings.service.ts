import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatingEntity } from './entities/rating.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { ProvidersService } from '../providers/providers.service';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(RatingEntity) private readonly repo: Repository<RatingEntity>,
    private readonly providersService: ProvidersService,
    private readonly sessionsService: SessionsService,
  ) { }

  async create(userId: string, dto: CreateRatingDto): Promise<RatingEntity> {
    const session = await this.sessionsService.findById(dto.sessionId);
    if (session.userId !== userId) throw new BadRequestException('You can only rate your own sessions');
    if (session.status !== 'completed') throw new BadRequestException('Session must be completed before rating');

    const existing = await this.repo.findOne({ where: { sessionId: dto.sessionId } });
    if (existing) throw new ConflictException('Session already rated');

    const rating = await this.repo.save(this.repo.create({ ...dto, userId, providerId: session.providerId }));
    await this.providersService.updateRating(session.providerId, dto.score);
    return rating;
  }

  async findByProvider(providerId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const [data, total] = await this.repo.findAndCount({
      where: { providerId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const { buildPagination } = await import('@connectify/utils');
    return { data, ...buildPagination(page, limit, total) };
  }

  async findBySession(sessionId: string) {
    return this.repo.findOne({ where: { sessionId } });
  }
}
