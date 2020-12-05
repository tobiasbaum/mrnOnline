import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CardBag, CardStash, GameField } from '../domain/game-field';
import { GameFieldStoreService } from '../game-field-store.service';
import { ModalCardCollectionService } from '../modal-card-collection.service';

@Component({
  selector: 'mrn-self-player',
  templateUrl: './self-player.component.html',
  styleUrls: ['./self-player.component.scss']
})
export class SelfPlayerComponent implements OnInit {

  private destroy = new Subject();

  constructor(
      private field: GameFieldStoreService, 
      private mcc: ModalCardCollectionService,
      cdr: ChangeDetectorRef, 
      ngz: NgZone) {
    field.subscribe(
      (f: GameField) => f.myself.subscribeForUpdate(() => ngz.run(() => cdr.markForCheck())),
      this.destroy);
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy.next();
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

  shuffleLibrary() {
    this.gameField.myself.shuffleLibrary();
  }

  createToken() {
    let lastName = localStorage.getItem('lastTokenName');
    let name = prompt('Name', lastName ? lastName : undefined);
    if (name) {
      localStorage.setItem('lastTokenName', name);
      this.gameField.myself.createToken(name);
    }
  }
}
