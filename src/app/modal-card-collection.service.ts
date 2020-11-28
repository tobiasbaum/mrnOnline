import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CardBag, CardCollection } from './domain/game-field';

@Injectable({
  providedIn: 'root'
})
export class ModalCardCollectionService {
  public collection: CardCollection = new CardBag([]);
  public name: string = 'coll';
  public act: string = '';
  public isShown: boolean = false;
  public closed = new Subject();

  constructor() { }

  show(cards: CardCollection, name: string, actions: string) {
    this.collection = cards;
    this.name = name;
    this.act = actions;
    this.isShown = true;
  }

}
