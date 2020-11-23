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
  public aTA: boolean = false;

  @Input()
  public aUT: boolean = false;

  @Input()
  public aPL: boolean = false;

  @Input()
  public aPT: boolean = false;

  @Input()
  public aGR: boolean = false;

  constructor(private field: GameFieldStoreService) { }

  ngOnInit(): void {
  }

  get gameField(): GameField {
    return this.field.gameField;
  }

}
