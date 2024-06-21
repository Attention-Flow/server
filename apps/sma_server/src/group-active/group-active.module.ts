import { Module } from '@nestjs/common';
import { GroupActiveService } from './group-active.service';
import { GroupActiveResolver } from './resolvers/group-active.resolver';
import { SmaGroupExtResolver } from './resolvers/sma-group-ext.resolver';

@Module({
  imports: [],
  providers: [GroupActiveService, GroupActiveResolver, SmaGroupExtResolver],
  exports: [GroupActiveService],
})
export class GroupActiveModule {}
