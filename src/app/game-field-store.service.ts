import { Injectable } from '@angular/core';
import { BehaviorSubject, NextObserver } from 'rxjs';
import { GameField } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class GameFieldStoreService {

  public store: BehaviorSubject<GameField | undefined> = new BehaviorSubject<GameField | undefined>(undefined);

  public get gameField(): GameField {
    return this.store.getValue() as GameField;
  }

  public init(f: GameField): void {
    this.store.next(f);
  }

  public subscribe(handler: (f:GameField) => void): void {
    this.store.subscribe(x => {
      if (x) {
        handler(x);
      }
    });
  }

  constructor() { }
}
