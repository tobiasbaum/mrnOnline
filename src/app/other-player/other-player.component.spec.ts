import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DistributedDatabaseSystem } from '../domain/distributed-database';
import { CardCache, GameField, LocalLibrary, OtherPlayer } from '../domain/game-field';
import { StorageStub } from '../domain/storage-stub';
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
    let peer = {
      on: () => {}
    };
    fieldService.init(new GameField(peer, 'x', 'y', [], true));
    let db = new DistributedDatabaseSystem('dbs', peer, 'x', new StorageStub(), true);
    let cardCache = new CardCache([], db, new LocalLibrary('dbs', new StorageStub(), []));
    let other = new OtherPlayer('willi', db, cardCache);
    component = fixture.componentInstance;
    component.me = other;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
