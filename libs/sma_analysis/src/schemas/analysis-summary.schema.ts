import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AnalysisWindowStatus } from '../enum/analysis-window-status.enum';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

export type SummaryDocument = HydratedDocument<Summary>;

@Schema({ collection: 'summary' })
export class Summary {
  @Prop({ type: Date, required: true, index: true })
  start_from: Date;

  @Prop({ type: Date, required: true, index: true })
  end_to: Date;

  @Prop({ required: true, type: String, index: true })
  datasource: Datasource;

  @Prop({ required: true, index: true })
  keyword: string;

  @Prop({ required: true })
  summary: string;
}

export const SummarySchema = SchemaFactory.createForClass(Summary).index(
  {
    datasource: 1,
    keyword: 1,
    start_from: 1,
    end_to: 1,
  },
  {
    unique: true,
  },
);
