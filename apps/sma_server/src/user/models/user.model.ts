import { ObjectType } from '@nestjs/graphql';
import { UserBasicInfo } from './user-basic-info.model';

@ObjectType()
export class User extends UserBasicInfo {}
