import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

import { SelfPlayerComponent } from './self-player.component';

describe('SelfPlayerComponent', () => {
  let component: SelfPlayerComponent;
  let fixture: ComponentFixture<SelfPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelfPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfPlayerComponent);
    let fieldService = TestBed.inject(GameFieldStoreService);
    let peer = {
      on: () => {}
    };
    fieldService.init(new GameField(peer, 'x', 'y', []));
    component = fixture.componentInstance;    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
