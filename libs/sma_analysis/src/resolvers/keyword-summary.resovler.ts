import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { KeywordSummaryModel } from '../models/keyword-summary.model';
import { SmaSummaryService } from '../services/sma_summary.service';
import { Datasource } from '@app/sma_groups/enum/datasource.enum';

@Resolver(() => KeywordSummaryModel)
export class KeywordSummaryResolver {
  constructor(private readonly service: SmaSummaryService) {}

  @Query(() => KeywordSummaryModel, {
    nullable: true,
  })
  async keywordSummary(
    @Args('datasource', { type: () => Datasource })
    datasource: Datasource,
    @Args('keyword')
    keyword: string,
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
  ) {
    return await this.service.get({
      datasource,
      start_from,
      end_to,
      keyword,
    });
  }

  @Mutation(() => KeywordSummaryModel)
  async doKeywordSummary(
    @Args('datasource', { type: () => Datasource })
    datasource: Datasource,
    @Args('keyword')
    keyword: string,
    @Args('start_from', { type: () => Date }) start_from: Date,
    @Args('end_to', { type: () => Date }) end_to: Date,
  ) {
    return await this.service.doSummary({
      datasource,
      start_from,
      end_to,
      keyword,
    });
  }
}
