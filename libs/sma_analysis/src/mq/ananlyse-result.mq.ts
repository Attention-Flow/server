import { GenerateSummaryResultDTO } from '../dto/generate-summary-result.dto';
import { KeywordsAnalyseResultDTO } from '../dto/keywords-analyse-result.dto';

export const ANALYSE_RESULT_QUEUE = 'analyse:result';

export type AnalyseResultBody =
  | {
      type: 'keywords';
      payload: KeywordsAnalyseResultDTO;
    }
  | {
      type: 'summary';
      payload: GenerateSummaryResultDTO;
    };
