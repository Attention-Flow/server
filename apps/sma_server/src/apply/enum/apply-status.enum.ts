import { registerEnumType } from '@nestjs/graphql';

export enum ApplyStatus {
  PENDING = 'pending',
  FINISHED = 'finished',
  REJECTED = 'rejected',
}

registerEnumType(ApplyStatus, {
  name: 'ApplyStatus',
});
