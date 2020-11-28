import { TestBed } from '@angular/core/testing';

import { ModalCardCollectionService } from './modal-card-collection.service';

describe('ModalCardCollectionService', () => {
  let service: ModalCardCollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModalCardCollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
