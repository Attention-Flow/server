import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SmaServerModule } from './sma_server.module';
import { CustomLogger } from '@app/sma_common/logger/logger';

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    SmaServerModule,
    {
      cors: true,
      logger: new CustomLogger(),
    },
  );

  const configService = app.get(ConfigService);

  try {
    if (configService.get('HTTP_PROXY_ENABLED') === 'true') {
      const url = configService.get('HTTP_PROXY_URL');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const proxy = require('node-global-proxy').default;
      proxy.setConfig(url);
      proxy.start();
      logger.warn(`node-global-proxy enabled: ${url}`);
    }
  } catch (_) {
    //
  }

  const port = configService.get<number>('PORT');

  await app.listen(port, () => {
    logger.log(`listen at ${port}`);
  });
}

bootstrap();
