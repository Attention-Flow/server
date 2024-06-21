import { Test, TestingModule } from '@nestjs/testing';
import { SmaAnalysisService } from './sma_analysis.service';

describe('SmaAnalysisService', () => {
  let service: SmaAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmaAnalysisService],
    }).compile();

    service = module.get<SmaAnalysisService>(SmaAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
