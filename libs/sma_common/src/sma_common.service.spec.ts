import { Test, TestingModule } from '@nestjs/testing';
import { SmaCommonService } from './sma_common.service';

describe('SmaCommonService', () => {
  let service: SmaCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmaCommonService],
    }).compile();

    service = module.get<SmaCommonService>(SmaCommonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
