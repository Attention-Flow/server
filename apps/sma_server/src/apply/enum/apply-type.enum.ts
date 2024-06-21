import { registerEnumType } from '@nestjs/graphql';

export enum ApplyType {
  NEW_GROUP = 'new_group',
}

registerEnumType(ApplyType, {
  name: 'ApplyType',
});
