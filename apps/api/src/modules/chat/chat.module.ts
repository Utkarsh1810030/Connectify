import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ChatService } from './chat.service';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    ModerationModule,
  ],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule { }
