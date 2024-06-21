import { SmaAnalysisService } from '@app/sma_analysis';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';
import { Injectable } from '@nestjs/common';
import { Hotpoint } from './models/hotpoint.model';
import { AnalysisWindowStatus } from '@app/sma_analysis/enum/analysis-window-status.enum';

type Keyword = {
  name: string;
  count: number;
};

@Injectable()
export class HotpointsService {
  constructor(private readonly analSvc: SmaAnalysisService) {}

  async countKeywords(
    datasource: Datasource,
    target_ids: string[],
    start_from: Date,
    end_to: Date,
  ): Promise<Keyword[]> {
    const wins = await this.analSvc.queryAnalysisWindows({
      datasource: datasource,
      group_ids: target_ids,
      time_range: {
        start_from,
        end_to,
      },
    });

    const hotpoints: Record<string, number> = {};
    for (const win of wins) {
      if (win.status === AnalysisWindowStatus.CREATED) {
        await this.analSvc.startKeywordsTask(datasource, win.target_id, win.id);
        continue;
      }
      for (const keyword of win.keywords) {
        if (!hotpoints[keyword.name]) {
          hotpoints[keyword.name] = 0;
        }
        hotpoints[keyword.name] += keyword.count;
      }
    }

    const keywords = Object.entries(hotpoints).map(([name, count]) => ({
      name,
      count,
    }));
    return await this.postprocessKeywords(keywords);
  }

  async postprocessKeywords(keywords: Keyword[]): Promise<Keyword[]> {
    const { synonymslist, blacklist } = await this.getKeywordsConfig();

    const keywordConvertMap = new Map<string, string>();
    for (const [key, values] of Object.entries(synonymslist)) {
      for (const value of values) {
        keywordConvertMap.set(value, key);
      }
    }

    const keywordsMap = new Map<string, number>();
    for (const keyword of keywords) {
      const name = keywordConvertMap.get(keyword.name) || keyword.name;
      if (blacklist.includes(name)) {
        continue;
      }
      if (!keywordsMap.has(name)) {
        keywordsMap.set(name, 0);
      }
      keywordsMap.set(name, keywordsMap.get(name) + keyword.count);
    }

    return [...keywordsMap.entries()].map(([name, count]) => ({ name, count }));
  }

  async calculateHotpoints(
    datasource: Datasource,
    target_ids: string[],
    start_from: Date,
    end_to: Date,
  ): Promise<Hotpoint[]> {
    const keywords = await this.countKeywords(
      datasource,
      target_ids,
      start_from,
      end_to,
    );

    const detlaT = end_to.getTime() - start_from.getTime();
    const prev_start_from = new Date(start_from.getTime() - detlaT);
    const prev_end_to = start_from;
    const prev_keywords = await this.countKeywords(
      datasource,
      target_ids,
      prev_start_from,
      prev_end_to,
    );
    const prev_keywords_map = new Map<string, Keyword>();
    for (const keyword of prev_keywords) {
      prev_keywords_map.set(keyword.name, keyword);
    }

    const hotpoints = new Map<string, Hotpoint>();
    for (const { name, count } of keywords) {
      const hotpoint: Hotpoint = {
        name,
        hot: count,
      };
      hotpoints.set(name, hotpoint);

      const prev = prev_keywords_map.get(name);
      if (prev && prev.count !== 0) {
        hotpoint.growth = (hotpoint.hot - prev.count) / prev.count;
      }
    }
    const values = [...hotpoints.values()];
    return values.sort((a, b) => b.hot - a.hot);
  }

  async getKeywordsConfig() {
    return {
      synonymslist: {
        Lens: ['Lens', 'lens', 'LENS'],
        ETH: ['Eth', 'eth', 'ETH'],
        Phaver: ['Phaver', 'phaver'],
      },
      blacklist: ['my', 'die', 'me', 'who', 'am', 'what', 'What'],
    };
  }

  async calculateKeywordHistory(
    datasource: Datasource,
    group_ids: string[],
    start_from: Date,
    end_to: Date,
    keyword: string,
  ) {
    const { synonymslist } = await this.getKeywordsConfig();
    const keywords = synonymslist[keyword] || [keyword];

    const samples: Record<string, number> = {};
    for (const keyword of keywords) {
      const wins = await this.analSvc.queryKeywordIncludedWindows(
        datasource,
        group_ids,
        { start_from, end_to },
        keyword,
      );
      for (const win of wins) {
        const start_from_ts = win.start_from.getTime();
        const end_to_ts = win.end_to.getTime();
        const key = `${start_from_ts}+${end_to_ts - start_from_ts}`;
        if (!samples[key]) {
          samples[key] = 0;
        }
        for (const k of win.keywords) {
          if (keywords.includes(k.name)) {
            samples[key] += k.count;
          }
        }
      }
    }

    return Object.entries(samples).map(([key, count]) => ({
      start_from: new Date(+key.split('+')[0]),
      end_to: new Date(+key.split('+')[0] + +key.split('+')[1]),
      count,
    }));
  }

  async searchKeywords(
    datasource: Datasource,
    group_ids: string[],
    keyword: string,
    limit: number,
  ) {
    const keywords = await this.analSvc.queryTotalKeywords(
      datasource,
      group_ids,
    );
    const validKeywords = await this.postprocessKeywords(keywords);
    const matchedKeywords = validKeywords.filter((_kw) =>
      _kw.name.toLowerCase().includes(keyword.toLowerCase()),
    );
    return matchedKeywords
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, limit);
  }
}
