import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, ObjectId } from 'mongoose';
import { GoogleInfo } from '../dto/google-info.dto';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop()
  id: string;

  @Prop({
    type: {
      id: String,
      emails: [{ value: String, verified: Boolean }],
      displayName: String,
      name: { familyName: String, givenName: String },
      photos: [{ value: String }],
    },
    required: false,
  })
  google?: GoogleInfo;
}

export const UserSchema = SchemaFactory.createForClass(User).index(
  {
    'google.id': 1,
  },
  { unique: true },
);
