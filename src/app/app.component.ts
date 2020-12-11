import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Subject } from 'rxjs';
import { GameField, Card, CardType, OtherPlayer } from './domain/game-field';
import { GameFieldStoreService } from './game-field-store.service';

declare var Peer: any;

interface GameSettings {
  name: string;
  idToJoin: string | undefined;
  clean: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mrnOnline';

  public state: string = 'initial';

  public formData = {
    playerName: this.getSettingValue('mrnUserName', ''),
    deckUrl: this.getSettingValue('deck', './assets/stubData.json')
  }

  getSettingValue(key: string, defaultValue: string) {
    let paramValue = new URL(location.href).searchParams.get(key);
    if (paramValue) {
      return paramValue;
    }
    let storedValue = localStorage.getItem(key);
    if (storedValue) {
      return storedValue;
    }
    return defaultValue;
  }

  private destroy = new Subject();

  constructor(
      public fieldService: GameFieldStoreService, 
      private http: HttpClient, 
      private ngz: NgZone, 
      cdr: ChangeDetectorRef) {
    fieldService.subscribe(
      f => f.registerPlayerChangeHandler(() => ngz.run(() => cdr.markForCheck())),
      this.destroy);
  }

  ngOnDestroy(): void {
    this.destroy.next();
  }

  gameExists(): boolean {
    let expected = 'mrn.' + this.formData.playerName;
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key?.startsWith(expected)) {
        return true;
      }
    }
    return false;
  }

  private start(idToJoin: string | undefined, clean: boolean) {
    let name = this.formData.playerName;
    if (name) {
      localStorage.setItem('mrnUserName', name);
      this.createPeer({name, idToJoin, clean});
    }
  }
  
  createPeer(s: GameSettings) {
    //var peer = new Peer(undefined, {host: 'localhost', port: 9000, key: 'peerjs', debug: 2});
    var peer = new Peer(undefined, {});
    peer.on('error', (err: any) => {
        console.log(err);
        alert('' + err);
    });
    peer.on('open', (id: string) => {
        //alert('My peer ID is: ' + id);
        this.ngz.run(() => this.loadDeckAndInitGame(peer, s));
    });
  }

private loadDeckAndInitGame(peer: any, s: GameSettings) {
  this.http.get(this.formData.deckUrl).subscribe((data: any) => {
    let deck: Card[] | undefined;
    if (s.clean) {
      deck = this.mapDecksAndCards(data);
      console.log('loaded deck with ' + deck.length + ' cards');
    } else {
      deck = undefined;
    }
    this.fieldService.init(new GameField(peer, peer.id, this.formData.playerName as string, deck, s.clean));
    if (s.idToJoin) {
      this.fieldService.gameField.connectToOtherPlayer(s.idToJoin);
    }
    this.state = 'joined';
  });
}

mapDecksAndCards(data: any): Card[] {
  let cards: any = {};
  for (let i = 0; i < data.cards.length; i++) {
    let card = data.cards[i];
    cards[card.name] = new CardType(card.name, card.type, card.img);
  }
  let d: string[] = data.deck;
  let deck = [];
  for (let i = 0; i < d.length; i++) {
    let card = d[i];
    deck.push(new Card(cards[card], this.formData.playerName as string));
  }
  return deck;
}

join() {
    var other = prompt('ID des Mitspielers');
    if (other) {
      this.start(other, true);
    }
}

addConnection() {
  var other = prompt('ID des Mitspielers');
  if (other) {
    this.fieldService.gameField.connectToOtherPlayer(other);
  }
}

waitForOthers() {
  this.start(undefined, true);
}

continueGame() {
  this.start(undefined, false);
}

dice(sides: number) {
  let n = Math.floor(Math.random() * sides) + 1;
  this.fieldService.gameField.myself.sendNotification('würfelt ' + n + ' (von ' + sides + ')');
}

randomOpponent() {
  let opponents = this.fieldService.gameField.others.filter(p => p.isInGame);
  if (opponents.length === 0) {
    return;
  }
  let n = Math.floor(Math.random() * opponents.length);
  this.fieldService.gameField.myself.sendNotification('würfelt Gegner ' + opponents[n].name);
}

isOwnTurn(): boolean {
  return this.fieldService.gameField.currentPlayerName === this.fieldService.gameField.myself.name;
}

get otherPlayers(): OtherPlayer[] {
  return this.fieldService.gameField.others;
}

endGameForPlayer() {
  let nameOrId = prompt('Spieler', this.fieldService.gameField.myself.name);
  if (nameOrId) {
    this.fieldService.gameField.endGameForPlayer(nameOrId);
  }
}

}
