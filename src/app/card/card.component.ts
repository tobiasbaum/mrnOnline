import { Component, Input, OnInit } from '@angular/core';
import { CardActionModeService } from '../card-action-mode.service';
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

  constructor(
    private field: GameFieldStoreService, 
    private hc: HoveredCardService,
    private mode: CardActionModeService) { }

  ngOnInit(): void {
  }

  get gameField(): GameField {
    return this.field.gameField;
  }

  hover(c: Card) {
    this.hc.setCard(c);
  }

  modifyOtherCard(cardId: number) {
    this.mode.selectForModify(cardId);
  }

  get isModifyMode(): boolean {
    return this.mode.isModifyMode;
  }

  modifyTargetSelected(targetId: number) {
    if (this.mode.savedId !== targetId) {
      this.gameField.modifyOtherCard(this.mode.savedId, targetId);
    }
    this.mode.normalMode();
  }

}
