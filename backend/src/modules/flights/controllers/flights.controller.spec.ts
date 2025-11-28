import { Test, TestingModule } from '@nestjs/testing';
import { FlightsController } from '../controllers/flights.controller';
import { beforeEach, describe, it } from 'node:test';

describe('FlightsController', () => {
  let controller: FlightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlightsController],
    }).compile();

    controller = module.get<FlightsController>(FlightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
