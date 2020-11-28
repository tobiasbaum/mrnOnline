import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Card } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class HoveredCardService {

  public store: Subject<Card> = new Subject<Card>();

  public setCard(c: Card): void {
    this.store.next(c);
  }

  public subscribe(handler: (c:Card) => void, destroy: Subject<any>): void {
    this.store
      .pipe(takeUntil(destroy))
      .subscribe(handler);
  }

  constructor() { }
}
