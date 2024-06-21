import { Test, TestingModule } from '@nestjs/testing';
import { SmaMessagesService } from './sma_messages.service';

describe('SmaMessagesService', () => {
  let service: SmaMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmaMessagesService],
    }).compile();

    service = module.get<SmaMessagesService>(SmaMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
