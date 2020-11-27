import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CardBag, CardStash, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';

@Component({
  selector: 'mrn-self-player',
  templateUrl: './self-player.component.html',
  styleUrls: ['./self-player.component.scss']
})
export class SelfPlayerComponent implements OnInit {

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

  untapAll() {
    this.field.gameField.myself.untapAll();
  }

  drawCard() {
    this.field.gameField.drawCard();
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

}
