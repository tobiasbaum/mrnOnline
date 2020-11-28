import { TestBed } from '@angular/core/testing';

import { CardActionModeService } from './card-action-mode.service';

describe('CardActionModeService', () => {
  let service: CardActionModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardActionModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
