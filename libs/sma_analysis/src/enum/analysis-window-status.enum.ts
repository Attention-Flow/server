import { registerEnumType } from '@nestjs/graphql';

export enum AnalysisWindowStatus {
  CREATED = 'created',
  ANALYSED = 'analysed',
}

registerEnumType(AnalysisWindowStatus, {
  name: 'AnalysisWindowStatus',
});
