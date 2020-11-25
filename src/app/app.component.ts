import { ChangeDetectorRef, Component } from '@angular/core';
import { GameField, Card, CardType, OtherPlayer } from './domain/game-field';
import { GameFieldStoreService } from './game-field-store.service';

declare var Peer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mrnOnline';

  public state: string = 'initial';

  constructor(public fieldService: GameFieldStoreService, cdr: ChangeDetectorRef) {
    fieldService.subscribe(f => f.registerPlayerChangeHandler(() => {console.log('hallo'); cdr.detectChanges()}));
  }

  createPeer(name: string) {
    if (window.mrnOnline.gameField) {
        return;
    }
    //var peer = new Peer(undefined, {host: 'localhost', port: 9000, key: 'peerjs', debug: 2});
    var peer = new Peer(undefined, {});
    peer.on('error', (err: any) => {
        console.log(err);
        alert('' + err);
    });
    peer.on('open', (id: string) => {
        //alert('My peer ID is: ' + id);
        window.mrnOnline.gameField = new GameField(peer, id, name);
        this.fieldService.init(window.mrnOnline.gameField);
        this.state = 'started';
    });
    peer.on('connection', (conn: any) => {
        //alert('Got connection ' + conn);
        window.mrnOnline.gameField.addOtherPlayer(conn);
    });
}

start() {
    this.mapDecksAndCards();
    let def = localStorage.getItem('mrnUserName');
    let name = prompt('Name', def !== null ? def : undefined);
    if (name) {
      localStorage.setItem('mrnUserName', name);
      this.createPeer(name);
    }
}

mapDecksAndCards() {
  let mi : MrnOnlineDuringInit = {
    cards: [],
    deck: [],
    gameField: undefined
  };
  window.mrnOnline = mi as MrnOnline;
 for (let i = 0; i < window.mrnData.cards.length; i++) {
   let card = window.mrnData.cards[i];
   window.mrnOnline.cards[card.name] = new CardType(card.name, card.img);
 }
 let d = window.mrnData.decks[0].cards;
 window.mrnOnline.deck = [];
 for (let i = 0; i < d.length; i++) {
   let card = d[i];
   window.mrnOnline.deck.push(new Card(window.mrnOnline.cards[card]));
 }
}

join() {
    var other = prompt('ID des Mitspielers');
    if (other) {
      window.mrnOnline.gameField.connectToOtherPlayer(other);
      this.state = 'joined';
    }
}

waitForOthers() {
  this.state = 'joined';
}

dice(sides: number) {
  let n = Math.floor(Math.random() * sides) + 1;
  this.fieldService.gameField.myself.sendNotification('würfelt ' + n + ' (von ' + sides + ')');
}

isOwnTurn(): boolean {
  return this.fieldService.gameField.currentPlayerName === this.fieldService.gameField.myself.name;
}

get otherPlayers(): OtherPlayer[] {
  return this.fieldService.gameField.others;
}

// window.mrnOnline = {};
// window.mrnOnline.cards = {
//  respite: new CardType('Respite'),
//  fog: new CardType('Fog'),
//  verdantForce: new CardType('Verdant Force'),
//  terror: new CardType('Terror'),
//  forest: new CardType('Forest')
// };

// window.mrnOnline.deck = [
//  new Card(window.mrnOnline.cards['respite']),
//  new Card(window.mrnOnline.cards['respite']),
//  new Card(window.mrnOnline.cards['respite']),
//  new Card(window.mrnOnline.cards['respite']),
//  new Card(window.mrnOnline.cards['fog']),
//  new Card(window.mrnOnline.cards['fog']),
//  new Card(window.mrnOnline.cards['fog']),
//  new Card(window.mrnOnline.cards['fog']),
//  new Card(window.mrnOnline.cards['verdantForce']),
//  new Card(window.mrnOnline.cards['forest']),
//  new Card(window.mrnOnline.cards['forest']),
//  new Card(window.mrnOnline.cards['forest']),
//  new Card(window.mrnOnline.cards['forest'])
// ];
}
