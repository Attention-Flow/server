import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserApply, UserApplySchema } from './schemas/user-apply.schema';
import { SubscriptionModule } from '../subscription/subscription.module';
import { UserApplyService } from './user-apply.service';
import { UserApplyResolver } from './resolvers/user-apply.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserApply.name,
        schema: UserApplySchema,
      },
    ]),
    SubscriptionModule,
  ],
  providers: [UserApplyService, UserApplyResolver],
  exports: [UserApplyService],
})
export class ApplyModule {}
