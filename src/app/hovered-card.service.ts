import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardType } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class HoveredCardService {
  private store: Subject<CardType> = new Subject<CardType>();

  public setCard(c: CardType): void {
    console.log('set hovered card: ' + c.name);
    this.store.next(c);
  }

  current(): Observable<CardType> {
    return this.store;
  }

  constructor() { }
}
