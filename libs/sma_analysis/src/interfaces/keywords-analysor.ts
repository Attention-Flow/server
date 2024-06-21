import { KeywordsAnalyseParams } from '../params/keywords-analyse.params';
import { KeywordsAnalyseResultDTO } from '../dto/keywords-analyse-result.dto';

export interface KeywordsAnalysor {
  analyse(params: KeywordsAnalyseParams): Promise<KeywordsAnalyseResultDTO>;
}
