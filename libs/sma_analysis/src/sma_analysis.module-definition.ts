import { ConfigurableModuleBuilder } from '@nestjs/common';

export interface SmaAnalysisModuleOptions {
  summaryAnalysorApiUrl: string;
  keywordsAnalysorApiUrl: string;
}

// export const MODULE_OPTIONS_TOKEN = 'SMA_ANALYSIS_MODULE_OPTIONS_TOKEN';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<SmaAnalysisModuleOptions>().build();
