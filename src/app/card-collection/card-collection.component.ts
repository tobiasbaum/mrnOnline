import { Component, Input, OnInit } from '@angular/core';
import { CardCollection } from '../domain/game-field';

@Component({
  selector: 'mrn-card-collection',
  templateUrl: './card-collection.component.html',
  styleUrls: ['./card-collection.component.scss']
})
export class CardCollectionComponent implements OnInit {

  @Input()
  public name: string = 'coll';

  @Input()
  public collection!: CardCollection;

  @Input()
  public act: string = '';

  constructor() { }

  ngOnInit(): void {
  }

}
