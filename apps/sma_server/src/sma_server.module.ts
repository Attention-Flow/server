import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { SmaAnalysisModule, SmaAnalysisService } from '@app/sma_analysis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { SmaCommonModule } from '@app/sma_common';
import { SmaGroupsModule } from '@app/sma_groups';
import { SmaMessagesModule } from '@app/sma_messages';
import { SubscriptionModule } from './subscription/subscription.module';
import { HotpointModule } from './hotpoint/hotpoint.module';
import { GroupActiveModule } from './group-active/group-active.module';
import { ApplyModule } from './apply/apply.module';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get('MONGODB_URI'),
          dbName: configService.get('MONGODB_DBNAME'),
        };
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      imports: [ConfigModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: async (configService: ConfigService) => {
        const debug = configService.get('DEBUG') === 'true';
        return {
          debug: debug,
          playground: debug,
          autoSchemaFile: true,
        };
      },
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          redis: {
            host: config.get('BULL_REDIS_HOST'),
            port: +config.get('BULL_REDIS_PORT'),
          },
          prefix: config.get('BULL_QUEUE_PREFIX'),
        };
      },
    }),
    BullBoardModule.forRoot({
      route: '/queues-19cbc964-450c-4a7c-9e9a-1d2367aabf22',
      adapter: ExpressAdapter, // Or FastifyAdapter from `@bull-board/fastify`
    }),

    SmaCommonModule,
    SmaGroupsModule,
    SmaMessagesModule,
    SmaAnalysisModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          keywordsAnalysorApiUrl: configService.get(
            'KEYWORDS_ANALYSOR_API_URI',
          ),
          summaryAnalysorApiUrl: configService.get('SUMMARY_ANALYSOR_API_URI'),
        };
      },
    }),
    UserModule,
    AuthModule,
    SubscriptionModule,
    HotpointModule,
    GroupActiveModule,
    ApplyModule,
  ],
  controllers: [],
  providers: [],
})
export class SmaServerModule {
  private readonly logger = new Logger(SmaServerModule.name);

  constructor(private readonly smaAnalysisService: SmaAnalysisService) {}

  onApplicationBootstrap() {
    this.logger.log('start loopProcessAllTargetGroups');
    this.smaAnalysisService
      .loopProcessAllTargetGroups(3600 * 1000)
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
