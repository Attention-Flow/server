export interface KeywordsAnalyseResultDTO {
  keywords: {
    name: string;
    count: number;
    msg_ids: string[];
  }[];
}
