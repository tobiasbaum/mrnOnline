import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { CardCollection } from '../domain/game-field';

@Component({
  selector: 'mrn-modal-card-collection',
  templateUrl: './modal-card-collection.component.html',
  styleUrls: ['./modal-card-collection.component.scss']
})
export class ModalCardCollectionComponent implements OnInit {

  @Input()
  public name: string = 'coll';

  @Input()
  public collection!: CardCollection;

  @Input()
  public act: string = '';
  
  @Input()
  public isShown: boolean = false;

  public closed: Subject<void> = new Subject();

  constructor() { }

  ngOnInit(): void {
  }

  show(cards: CardCollection, name: string, actions: string) {
    this.collection = cards;
    this.name = name;
    this.act = actions;
    this.isShown = true;
  }

  hide() {
    this.isShown = false;
    this.closed.next();
  }

}
