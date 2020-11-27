import { Component, Input, OnInit } from '@angular/core';
import { Card, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';
import { HoveredCardService } from '../hovered-card.service';

@Component({
  selector: 'mrn-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit {

  @Input()
  public card!: Card;

  @Input()
  public act: string = '';

  public large: boolean = false;

  constructor(private field: GameFieldStoreService, private hc: HoveredCardService) { }

  ngOnInit(): void {
  }

  get gameField(): GameField {
    return this.field.gameField;
  }

  hover() {
    this.hc.setCard(this.card);
  }

}
