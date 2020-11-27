import { TestBed } from '@angular/core/testing';

import { HoveredCardService } from './hovered-card.service';

describe('HoveredCardService', () => {
  let service: HoveredCardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HoveredCardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
