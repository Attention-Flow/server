import { registerEnumType } from '@nestjs/graphql';

export enum Datasource {
  Telegram = 'telegram',
  Lens = 'lens',
}

registerEnumType(Datasource, {
  name: 'Datasource',
});
