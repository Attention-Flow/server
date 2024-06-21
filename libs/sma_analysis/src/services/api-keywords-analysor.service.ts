import { Inject, Injectable, Logger } from '@nestjs/common';
import { KeywordsAnalysor } from '../interfaces/keywords-analysor';
import { KeywordsAnalyseResultDTO } from '../dto/keywords-analyse-result.dto';
import { KeywordsAnalyseParams } from '../params/keywords-analyse.params';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import {
  MODULE_OPTIONS_TOKEN,
  SmaAnalysisModuleOptions,
} from '../sma_analysis.module-definition';
import { GenerateSummaryParams } from '../params/generate-summary.params';
import { GenerateSummaryResultDTO } from '../dto/generate-summary-result.dto';

@Injectable()
export class ApiKeywordsAnalysorService implements KeywordsAnalysor {
  private readonly logger = new Logger(ApiKeywordsAnalysorService.name);
  private KEYWORDS_URL = 'http://localhost:8899/analyse';
  private SUMMARY_URL = 'http://localhost:8899/summary';

  constructor(
    @Inject(MODULE_OPTIONS_TOKEN)
    private options: SmaAnalysisModuleOptions,

    private readonly httpSvc: HttpService,
  ) {
    this.KEYWORDS_URL = options.keywordsAnalysorApiUrl || this.KEYWORDS_URL;
    this.SUMMARY_URL = options.summaryAnalysorApiUrl || this.SUMMARY_URL;
  }

  async analyse(
    params: KeywordsAnalyseParams,
  ): Promise<KeywordsAnalyseResultDTO> {
    try {
      this.logger.verbose(`api keywords analysor: ${this.KEYWORDS_URL}`);
      const { status, data } = await lastValueFrom(
        this.httpSvc.post<KeywordsAnalyseResultDTO>(this.KEYWORDS_URL, params),
      );
      if (status !== 200) {
        throw new Error(`analyse failed, status: ${status}`);
      }
      return data;
    } catch (err) {
      // this.logger.error(err);
      this.logger.error(err.response.data);
      // console.log(err.response);
      // console.log(JSON.stringify(err.response.data));
      throw err;
    }
  }

  async summary(
    params: GenerateSummaryParams,
  ): Promise<GenerateSummaryResultDTO> {
    try {
      this.logger.verbose(`api keywords analysor: ${this.SUMMARY_URL}`);
      const { status, data } = await lastValueFrom(
        this.httpSvc.post<GenerateSummaryResultDTO>(this.SUMMARY_URL, params),
      );
      if (status !== 200) {
        throw new Error(`analyse failed, status: ${status}`);
      }
      return data;
    } catch (err) {
      // this.logger.error(err);
      this.logger.error(err.response.data);
      // console.log(err.response);
      // console.log(JSON.stringify(err.response.data));
      throw err;
    }
  }
}
