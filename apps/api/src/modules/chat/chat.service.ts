import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schemas/conversation.schema';
import { Message } from './schemas/message.schema';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private readonly convModel: Model<Conversation>,
    @InjectModel(Message.name) private readonly msgModel: Model<Message>,
    private readonly moderationService: ModerationService,
  ) { }

  async getOrCreateConversation(sessionId: string, participants: [string, string]): Promise<Conversation> {
    const existing = await this.convModel.findOne({ sessionId });
    if (existing) return existing;
    return this.convModel.create({ sessionId, participants });
  }

  async sendMessage(conversationId: string, senderId: string, sessionId: string, content: string, type = 'text'): Promise<Message> {
    const conv = await this.convModel.findById(conversationId);
    if (!conv) throw new NotFoundException('Conversation not found');

    const { filteredContent, isClean } = await this.moderationService.moderateMessage(sessionId, senderId, content);

    const message = await this.msgModel.create({
      conversationId: new Types.ObjectId(conversationId),
      senderId, type, content: filteredContent, isFiltered: !isClean,
    });

    await this.convModel.findByIdAndUpdate(conversationId, { lastMessageAt: new Date() });
    return message;
  }

  async getMessages(conversationId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.msgModel.find({ conversationId: new Types.ObjectId(conversationId) })
        .sort({ created_at: -1 }).skip(skip).limit(limit),
      this.msgModel.countDocuments({ conversationId: new Types.ObjectId(conversationId) }),
    ]);
    return { data: data.reverse(), total, page, limit, hasNext: page * limit < total };
  }

  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.msgModel.updateMany(
      { conversationId: new Types.ObjectId(conversationId), senderId: { $ne: userId }, readAt: null },
      { $set: { readAt: new Date() } },
    );
  }
}
