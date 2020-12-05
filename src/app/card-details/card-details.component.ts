import { Component, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CardType } from '../domain/game-field';
import { HoveredCardService } from '../hovered-card.service';

@Component({
  selector: 'mrn-card-details',
  templateUrl: './card-details.component.html',
  styleUrls: ['./card-details.component.scss']
})
export class CardDetailsComponent implements OnInit {

  constructor(private hc: HoveredCardService) { 
    //this.current = new CardType('MRN', 'https://c1.scryfall.com/file/scryfall-cards/normal/front/a/9/a9f9c279-e382-4feb-9575-196e7cf5d7dc.jpg?1562799139');
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked() {
    console.log('details view checked');
  }

  public get current(): Observable<CardType> {
    return this.hc.current();
  }

}
