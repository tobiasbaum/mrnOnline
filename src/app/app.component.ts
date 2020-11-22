import { Component } from '@angular/core';
import { GameField, Card, CardType } from './domain/game-field';

declare var Peer: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mrnOnline';

  createPeer(name: string) {
    if (window.mrnOnline.gameField) {
        return;
    }
    //var peer = new Peer(null, {host: '192.168.178.30', port: 9000, key: 'peerjs'});
    var peer = new Peer(undefined, {host: 'localhost', port: 9000, key: 'peerjs', debug: 2});
    peer.on('error', function (err: any) {
        console.log(err);
        alert('' + err);
    });
    peer.on('open', function(id: string) {
        //alert('My peer ID is: ' + id);
        $('#inhalt').html('My peer ID is: ' + id);
        window.mrnOnline.gameField = new GameField(peer, id, name);
    });
    peer.on('connection', function(conn: any) {
        //alert('Got connection ' + conn);
        window.mrnOnline.gameField.addOtherPlayer(conn);
    });
}

start() {
    this.mapDecksAndCards();
    var name = prompt('Name');
    if (name) {
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
    }
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
