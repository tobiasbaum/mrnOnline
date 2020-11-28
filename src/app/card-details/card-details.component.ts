import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CardType } from '../domain/game-field';
import { HoveredCardService } from '../hovered-card.service';

@Component({
  selector: 'mrn-card-details',
  templateUrl: './card-details.component.html',
  styleUrls: ['./card-details.component.scss']
})
export class CardDetailsComponent implements OnInit {

  public current: CardType;

  private destroy = new Subject();

  constructor(private hc: HoveredCardService) { 
    this.current = new CardType('MRN', 'https://c1.scryfall.com/file/scryfall-cards/normal/front/a/9/a9f9c279-e382-4feb-9575-196e7cf5d7dc.jpg?1562799139');
    this.hc.subscribe(c => this.current = c.type, this.destroy);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

}
