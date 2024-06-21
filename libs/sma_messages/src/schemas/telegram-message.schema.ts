import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelegramMessageDocument = HydratedDocument<TelegramMessage>;

@Schema({ collection: 'telegram_messages' })
export class TelegramMessage {
  @Prop({ type: String })
  _: string;

  @Prop()
  id: number;

  @Prop({
    type: {
      _: String,
      channel_id: Number,
    },
  })
  peer_id: {
    _: string;
    channel_id: number;
  };

  @Prop({
    type: {
      _: String,
      user_id: Number,
      channel_id: Number,
    },
    required: false,
  })
  from_id?: {
    _: 'PeerChannel' | 'PeerUser';
    user_id?: number;
    channel_id?: number;
  };

  @Prop({ type: Date })
  date: Date;

  @Prop({ type: String })
  message: string;
}

export const TelegramMessageSchema = SchemaFactory.createForClass(
  TelegramMessage,
)
  .index({ _: 1 })
  .index({ 'peer_id.channel_id': 1 })
  .index({ date: 1 });
