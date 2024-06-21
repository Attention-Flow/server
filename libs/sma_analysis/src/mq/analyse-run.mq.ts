export const ANALYSE_RUN_QUEUE = 'analyse:run';

import { Datasource } from '@app/sma_groups/enum/datasource.enum';

export type AnalyseRunBody =
  | {
      type: 'keywords';
      datasource: Datasource;
      window_id: string;
    }
  | {
      type: 'summary';
      keyword: string;
      // payload: GenerateSummaryParams;
      datasource: Datasource;
      start_from: string;
      end_to: string;
    };
