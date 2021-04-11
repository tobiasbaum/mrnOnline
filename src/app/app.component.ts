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
  spectator: boolean;
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
      private ngz: NgZone) {
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

  private start(idToJoin: string | undefined, clean: boolean, spectator: boolean) {
    let name = this.formData.playerName;
    if (name) {
      localStorage.setItem('mrnUserName', name);
      this.createPeer({name, idToJoin, clean, spectator});
    }
  }
  
  createPeer(s: GameSettings) {
    //var peer = new Peer(undefined, {host: 'localhost', port: 9000, key: 'peerjs', debug: 2});
    var peer = new Peer(undefined, {});
    peer.on('error', (err: any) => {
        console.log(err);
        alert('' + err);
    });
    peer.once('open', (id: string) => {
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
    if (s.spectator) {
      this.fieldService.gameField.setEndedPlayer(this.fieldService.gameField.myself.name, true);
    }
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
      this.start(other, true, false);
    }
}

joinAsSpectator() {
  var other = prompt('ID des Mitspielers');
  if (other) {
    this.start(other, true, true);
  }
}

waitForOthers() {
  this.start(undefined, true, false);
}

continueGame() {
  this.start(undefined, false, false);
}

}
