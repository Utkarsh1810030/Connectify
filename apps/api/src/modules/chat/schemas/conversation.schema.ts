import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'conversations', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Conversation extends Document {
  @Prop({ required: true, index: true }) sessionId: string;
  @Prop({ type: [String], required: true }) participants: string[];
  @Prop({ type: Date, default: null }) lastMessageAt: Date | null;
}
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
