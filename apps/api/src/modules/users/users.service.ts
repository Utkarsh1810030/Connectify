import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) { }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async upsertByPhone(phone: string): Promise<UserEntity> {
    const existing = await this.findByPhone(phone);
    if (existing) return existing;
    const user = this.repo.create({ phone });
    return this.repo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity> {
    await this.findById(id); // throws if not found
    await this.repo.update(id, dto);
    return this.findById(id);
  }

  async ban(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.update(id, { isBanned: true });
  }

  async unban(id: string): Promise<void> {
    await this.findById(id);
    await this.repo.update(id, { isBanned: false });
  }

  async updateFcmToken(id: string, fcmToken: string): Promise<void> {
    await this.repo.update(id, { fcmToken });
  }
}
