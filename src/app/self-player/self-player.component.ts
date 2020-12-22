import { ChangeDetectorRef, Component, Inject, NgZone, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { CardBag, CardStash, GameField, OtherPlayer } from '../domain/game-field';
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
      public field: GameFieldStoreService, 
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

  get poisonCount(): number {
    return this.field.gameField.myself.poisonCount;
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

  get isInGame(): boolean {
    return this.field.gameField.myself.isInGame;
  }

  untapAll() {
    this.field.gameField.myself.untapAll();
  }

  drawCard() {
    this.field.gameField.myself.drawCard();
  }

  discardAtRandom() {
    this.field.gameField.myself.discardAtRandom();
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

  decreasePoisonCount() {
    this.field.gameField.myself.changePoisonCount(-1);
  }

  increasePoisonCount() {
    this.field.gameField.myself.changePoisonCount(1);
  }

  multiPoisonDecrease() {
    let count = prompt('Anzahl verlorener Giftmarken');
    if (count) {
      this.field.gameField.myself.changePoisonCount(-Number.parseInt(count));
    }
  }

  multiPoisonIncrease() {
    let count = prompt('Anzahl zusätzlicher Giftmarken');
    if (count) {
      this.field.gameField.myself.changePoisonCount(Number.parseInt(count));
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
    this.mcc.show(() => this.gameField.myself.library, 'Bibliothek', 'DR,PL,PT,GR');
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
  diceX() {
    let x = prompt('Anzahl Seiten', '20');
    if (x) {
      this.dice(parseInt(x));
    }
  }
  
  dice(sides: number) {
    let n = Math.floor(Math.random() * sides) + 1;
    this.field.gameField.myself.sendNotification('würfelt ' + n + ' (von ' + sides + ')');
  }
  
  randomOpponent() {
    let opponents = this.field.gameField.others.filter(p => p.isInGame);
    if (opponents.length === 0) {
      return;
    }
    let n = Math.floor(Math.random() * opponents.length);
    this.field.gameField.myself.sendNotification('würfelt Gegner ' + opponents[n].name);
  }
  
  isOwnTurn(): boolean {
    return this.field.gameField.currentPlayerName === this.field.gameField.myself.name;
  }
  
  get otherPlayers(): OtherPlayer[] {
    return this.field.gameField.others;
  }
  
  endGameForPlayer() {
    let nameOrId = prompt('Spieler', this.field.gameField.myself.name);
    if (nameOrId) {
      this.field.gameField.endGameForPlayer(nameOrId);
    }
  }
  
  addConnection() {
    var other = prompt('ID des Mitspielers');
    if (other) {
      this.field.gameField.connectToOtherPlayer(other);
    }
  }

  copyID() {
    navigator.clipboard.writeText(this.id);
    alert('ID ' + this.id + 'wurde in die Zwischenablage kopiert');
  }

  get tableWidth(): number {
    return window.innerWidth - 22;
  }

  get tableHeight(): number {
    return window.innerHeight - 1;
  }

get headerWidth(): number {
  return ((window.innerWidth - (250 + 502)) - 20);
}

get mainHeight(): number {
  return window.innerHeight - 52;
}

get gamefieldWidth(): number {
return window.innerWidth - 272;
}

get gamefieldHeight(): number {
  return (((window.innerHeight - 54)/2)-2);
}

get opponentTableWidth(): number {
  return ((this.field.gameField.allActivePlayers.length - 1) * (window.innerWidth - 272));
}

}
