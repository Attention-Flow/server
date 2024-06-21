import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Datasource } from '../enum/datasource.enum';
import { GroupContentType } from '../enum/group-type.enum';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ collection: 'target_groups' })
export class Group {
  @Prop()
  latest_ts: number;
  @Prop()
  start_ts: number;
  
  @Prop()
  target_id: string;
  @Prop()
  name: string;

  @Prop({ type: String })
  datasource: Datasource;
  @Prop({ type: String })
  content_type: GroupContentType;
  @Prop()
  enable_fetcher: boolean;
  @Prop()
  enable_analysor: boolean;
}

export const GroupSchema = SchemaFactory.createForClass(Group).index({
  datasource: 1,
  target_id: 1,
});
