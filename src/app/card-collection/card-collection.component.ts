import { Component, Input, OnInit } from '@angular/core';
import { CardCollection, CardType } from '../domain/game-field';
import { HoveredCardService } from '../hovered-card.service';

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

  constructor(private hc: HoveredCardService) { }

  ngOnInit(): void {
  }

  cardCombined() {
    let counts: Map<string, number> = new Map();
    this.collection.cards.forEach(c => {
      if (counts.has(c.name)) {
        counts.set(c.name, counts.get(c.name) as number + 1);
      } else {
        counts.set(c.name, 1);
      }
    });
    let types: CardType[] = [];
    this.collection.cards.forEach(c => {
      if (!types.find(t => t.name === c.type.name)) {
        types.push(c.type);
      }
    });
    return types
      .map(n => {
        if (counts.get(n.name) as number > 1) {
          return {
            text: n.name + ' (x' + counts.get(n.name) + ')',
            type: n
          } 
        } else {
          return {
            text: n.name,
            type: n
          } 
        }
      });
  }

  hover(c: CardType) {
    this.hc.setCard(c);
  }

}
