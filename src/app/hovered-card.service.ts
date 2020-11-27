import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Card } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class HoveredCardService {

  public store: Subject<Card> = new Subject<Card>();

  public setCard(c: Card): void {
    this.store.next(c);
  }

  public subscribe(handler: (c:Card) => void): void {
    this.store.subscribe(handler);
  }

  constructor() { }
}
