import { TestBed } from '@angular/core/testing';

import { GameFieldStoreService } from './game-field-store.service';

describe('GameFieldStoreService', () => {
  let service: GameFieldStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameFieldStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
