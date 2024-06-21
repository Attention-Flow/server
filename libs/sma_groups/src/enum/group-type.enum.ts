import { registerEnumType } from '@nestjs/graphql';

export enum GroupContentType {
  CHAT = 'chat',
  POST = 'post',
}

registerEnumType(GroupContentType, {
  name: 'GroupContentType',
});
