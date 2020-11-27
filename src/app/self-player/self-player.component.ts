import { ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CardBag, CardStash, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';
import { ModalCardCollectionComponent } from '../modal-card-collection/modal-card-collection.component';

@Component({
  selector: 'mrn-self-player',
  templateUrl: './self-player.component.html',
  styleUrls: ['./self-player.component.scss']
})
export class SelfPlayerComponent implements OnInit {

  @ViewChild(ModalCardCollectionComponent)
  private mcc!: ModalCardCollectionComponent;

  constructor(private field: GameFieldStoreService, private cdr: ChangeDetectorRef) {
    field.subscribe((f: GameField) => f.myself.subscribeForUpdate(() => cdr.markForCheck()));
  }

  ngOnInit(): void {
  }

  get name(): string {
    return this.field.gameField.myself.name;
  }

  get id(): string {
    return this.field.gameField.myself.id;
  }

  get gameField(): GameField {
    return this.field.gameField;
  }

  librarySize(): number {
    return this.field.gameField.myself.library.size;
  }

  get lifes(): number {
    return this.field.gameField.myself.lifes;
  }

  get hand(): CardBag {
    return this.field.gameField.myself.hand;
  }

  get table(): CardBag {
    return this.field.gameField.myself.table;
  }

  get graveyard(): CardStash {
    return this.field.gameField.myself.graveyard;
  }

  get exile(): CardBag {
    return this.field.gameField.myself.exile;
  }

  untapAll() {
    this.field.gameField.myself.untapAll();
  }

  drawCard() {
    this.field.gameField.myself.drawCard();
  }

  decreaseLifes() {
    this.field.gameField.decreaseLifes();
  }

  increaseLifes() {
    this.field.gameField.increaseLifes();
  }

  multiLifeDecrease() {
    let count = prompt('Anzahl verlorener Leben');
    if (count) {
      this.field.gameField.myself.changeLifeCount(-Number.parseInt(count));
    }
  }

  multiLifeIncrease() {
    let count = prompt('Anzahl zusätzlicher Leben');
    if (count) {
      this.field.gameField.myself.changeLifeCount(Number.parseInt(count));
    }
  }

  isCurrentPlayer(): boolean {
    return this.field.gameField.currentPlayerName === this.field.gameField.myself.name;
  }

  openLibrary() {
    this.gameField.myself.sendNotification('öffnet die Bibliothek');
    let subscr = this.mcc.closed.subscribe(() => {
      this.gameField.myself.sendNotification('schließt die Bibliothek')
      subscr.unsubscribe();
    });
    this.mcc.show(this.gameField.myself.library, 'Bibliothek', 'DR,PL,PT,GR');
  }

}
