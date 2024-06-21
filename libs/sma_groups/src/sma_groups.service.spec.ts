import { Test, TestingModule } from '@nestjs/testing';
import { SmaGroupsService } from './sma_groups.service';

describe('SmaGroupsService', () => {
  let service: SmaGroupsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmaGroupsService],
    }).compile();

    service = module.get<SmaGroupsService>(SmaGroupsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
