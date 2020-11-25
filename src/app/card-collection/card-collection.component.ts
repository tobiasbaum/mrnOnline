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

  @Input()
  public collapsed: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  cardString(): string {
    let counts: Map<string, number> = new Map();
    this.collection.cards.forEach(c => {
      if (counts.has(c.name)) {
        counts.set(c.name, counts.get(c.name) as number + 1);
      } else {
        counts.set(c.name, 1);
      }
    });
    let names: string[] = [];
    this.collection.cards.forEach(c => {
      if (names.indexOf(c.name) < 0) {
        names.push(c.name);
      }
    });
    return names
      .map(n => {
        if (counts.get(n) as number > 1) {
          return n + ' (x' + counts.get(n) + ')';
        } else {
          return n;
        }
      })
      .join(", ");
  }

}
