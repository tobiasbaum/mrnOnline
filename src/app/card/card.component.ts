import { Component, Input, OnInit } from '@angular/core';
import { Card, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

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

  constructor(private field: GameFieldStoreService) { }

  ngOnInit(): void {
  }

  get gameField(): GameField {
    return this.field.gameField;
  }

}
