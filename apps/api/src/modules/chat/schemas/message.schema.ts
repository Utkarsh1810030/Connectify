import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ collection: 'messages', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true }) conversationId: Types.ObjectId;
  @Prop({ required: true }) senderId: string;
  @Prop({ enum: ['text','image','system'], default: 'text' }) type: string;
  @Prop({ required: true }) content: string;
  @Prop({ default: false }) isFiltered: boolean;
  @Prop({ default: null }) readAt: Date | null;
}
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversationId: 1, created_at: -1 });
