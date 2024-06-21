import { Injectable } from '@nestjs/common';
import { DatasourceService } from './interfaces/datasource-service';
import { TelegramDatasourceService } from './services/telegram-datasource.service';
import { LensDatasourceService } from './services/lens-datasource.service';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@Injectable()
export class SmaMessagesService {
  private datasourceSvcMap = new Map<Datasource, DatasourceService>();

  constructor(
    telegramDatasourceSvc: TelegramDatasourceService,
    lensDatasourceSvc: LensDatasourceService,
  ) {
    this.datasourceSvcMap.set(Datasource.Telegram, telegramDatasourceSvc);
    this.datasourceSvcMap.set(Datasource.Lens, lensDatasourceSvc);
  }

  getDatasourceImpl(datasource: Datasource): DatasourceService {
    return this.datasourceSvcMap.get(datasource);
  }
}
