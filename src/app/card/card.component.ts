import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CardActionModeService } from '../card-action-mode.service';
import { Card, CardBag, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';
import { HoveredCardService } from '../hovered-card.service';
import { ModalCardCollectionService } from '../modal-card-collection.service';

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

  private destroy = new Subject();

  constructor(
    private field: GameFieldStoreService, 
    private hc: HoveredCardService,
    private mode: CardActionModeService,
    private cdr: ChangeDetectorRef,
    private mcc: ModalCardCollectionService) {

    mode.subscribe(() => cdr.detectChanges(), this.destroy);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy.next();
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

  setCounter(card: Card) {
    let value = prompt('Counter-Wert', card.counter);
    if (value === null) {
      return;
    }
    if (value === '') {
      this.gameField.myself.setCounter(card.id, undefined);
    } else {
      this.gameField.myself.setCounter(card.id, value);
    }
  }

  modifyTargetSelected(targetId: number) {
    if (this.mode.savedId !== targetId) {
      this.gameField.modifyOtherCard(this.mode.savedId, targetId);
    }
    this.mode.normalMode();
  }

  openStack() {
    let cards = new CardBag(this.card.modifiers);
    this.mcc.show(cards, 'Kartendetails', this.intersectActions(['HA', 'GR', 'EX', 'PL']));
  }

  private intersectActions(otherActions: string[]): string {
    return otherActions
      .filter(s => this.act.indexOf(s) >= 0)
      .join(',');
  }

}
