import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Subject } from 'rxjs';
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

  public formData = {
    playerName: localStorage.getItem('mrnUserName'),
    deckUrl: './assets/stubData.json'
  } 

  private destroy = new Subject();

  constructor(public fieldService: GameFieldStoreService, private http: HttpClient, cdr: ChangeDetectorRef) {
    fieldService.subscribe(
      f => f.registerPlayerChangeHandler(() => {cdr.detectChanges()}),
      this.destroy);
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  createPeer(name: string) {
    //var peer = new Peer(undefined, {host: 'localhost', port: 9000, key: 'peerjs', debug: 2});
    var peer = new Peer(undefined, {});
    peer.on('error', (err: any) => {
        console.log(err);
        alert('' + err);
    });
    peer.on('open', (id: string) => {
        //alert('My peer ID is: ' + id);
        this.loadDeckAndStart(peer, id);
    });
    peer.on('connection', (conn: any) => {
        //alert('Got connection ' + conn);
        this.fieldService.gameField.addOtherPlayer(conn);
    });
}

private loadDeckAndStart(peer: any, playerId: string) {
  this.http.get(this.formData.deckUrl).subscribe((data: any) => {
    let deck: Card[] = this.mapDecksAndCards(data, playerId);
    console.log('loaded deck with ' + deck.length + ' cards');
    this.fieldService.init(new GameField(peer, playerId, this.formData.playerName as string, deck));
    this.state = 'started';
  });
}

start() {
  let name = this.formData.playerName;
  if (name) {
    localStorage.setItem('mrnUserName', name);
    this.createPeer(name);
  }
}

mapDecksAndCards(data: any, peerId: string): Card[] {
  let cards: any = {};
  for (let i = 0; i < data.cards.length; i++) {
    let card = data.cards[i];
    cards[card.name] = new CardType(card.name, card.img);
  }
  let d: string[] = data.deck;
  let deck = [];
  for (let i = 0; i < d.length; i++) {
    let card = d[i];
    deck.push(new Card(cards[card], peerId));
  }
  return deck;
}

join() {
    var other = prompt('ID des Mitspielers');
    if (other) {
      this.fieldService.gameField.connectToOtherPlayer(other);
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

}
