import { Module } from '@nestjs/common';
import { HotpointsResolver } from './resolvers/hotpoints.resolver';
import { HotpointsService } from './hotpoints.service';

@Module({
  imports: [],
  providers: [HotpointsService, HotpointsResolver],
})
export class HotpointModule {}
