import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardBag } from '../domain/game-field';

import { CardCollectionComponent } from './card-collection.component';

describe('CardCollectionComponent', () => {
  let component: CardCollectionComponent;
  let fixture: ComponentFixture<CardCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardCollectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCollectionComponent);
    component = fixture.componentInstance;
    component.collection = new CardBag([]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
