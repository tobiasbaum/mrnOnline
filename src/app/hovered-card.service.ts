import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardType } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class HoveredCardService {

  public store: Subject<CardType> = new Subject<CardType>();

  public setCard(c: CardType): void {
    this.store.next(c);
  }

  public subscribe(handler: (c:CardType) => void, destroy: Subject<any>): void {
    this.store
      .pipe(takeUntil(destroy))
      .subscribe(handler);
  }

  constructor() { }
}
