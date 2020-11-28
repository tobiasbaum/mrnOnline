import { Injectable } from '@angular/core';
import { BehaviorSubject, NextObserver, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

  public subscribe(handler: (f:GameField) => void, destroy: Subject<any>): void {
    this.store
      .pipe(takeUntil(destroy))
      .subscribe(x => {
        if (x) {
          handler(x);
        }
      });
  }

  constructor() { }
}
