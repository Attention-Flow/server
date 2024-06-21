import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AnalysisWindowStatus } from '../enum/analysis-window-status.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

export type AnalysisWindowDocument = HydratedDocument<AnalysisWindow>;

@Schema({ collection: 'analysis_windows' })
export class AnalysisWindow {
  @Prop({ type: Date, required: true })
  start_from: Date;

  @Prop({ type: Date, required: true })
  end_to: Date;

  
  @Prop({ required: true })
  duration: number;

  @Prop({ required: true })
  target_id: string;

  @Prop({ required: true, type: String })
  datasource: Datasource;

  @Prop({
    type: String,
    enum: ['created', 'analysed'],
    default: 'created',
  })
  status: AnalysisWindowStatus;

  @Prop()
  messages: number;

  @Prop({
    default: [],
    type: [{ name: String, count: Number, msg_ids: [String] }],
  })
  keywords: { name: string; count: number; msg_ids: string[] }[];
}

export const AnalysisWindowSchema = SchemaFactory.createForClass(
  AnalysisWindow,
).index(
  {
    datasource: 1,
    target_id: 1,
    start_from: 1,
    end_to: 1,
  },
  {
    unique: true,
  },
);
