import { Global, Module } from '@nestjs/common';
import { SmaGroupsService } from './sma_groups.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from './schemas/target-group.schema';
import { SmaGroupsResolver } from './resolvers/sma-groups.resolver';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
  ],
  providers: [SmaGroupsService, SmaGroupsResolver],
  exports: [SmaGroupsService],
})
export class SmaGroupsModule {}
