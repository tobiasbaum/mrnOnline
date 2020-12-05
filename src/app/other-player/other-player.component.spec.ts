import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DistributedDatabaseSystem } from '../domain/distributed-database';
import { GameField, OtherPlayer } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

import { OtherPlayerComponent } from './other-player.component';

describe('OtherPlayerComponent', () => {
  let component: OtherPlayerComponent;
  let fixture: ComponentFixture<OtherPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtherPlayerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherPlayerComponent);
    let fieldService = TestBed.inject(GameFieldStoreService);
    fieldService.init(new GameField(null, 'x', 'y', []));
    let other = new OtherPlayer('willi', new DistributedDatabaseSystem(null, 'x'));
    component = fixture.componentInstance;
    component.me = other;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
