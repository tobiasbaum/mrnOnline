import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCardCollectionComponent } from './modal-card-collection.component';

describe('ModalCardCollectionComponent', () => {
  let component: ModalCardCollectionComponent;
  let fixture: ComponentFixture<ModalCardCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalCardCollectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalCardCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
