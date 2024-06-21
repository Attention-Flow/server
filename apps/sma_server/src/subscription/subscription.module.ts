import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { GroupSubscriptionsResolver } from './resolvers/group-subscriptions.resolver';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
  ],
  providers: [SubscriptionService, GroupSubscriptionsResolver],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
