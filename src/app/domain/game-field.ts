import { DistributedDatabaseSystem } from './distributed-database';

class CardType {
    constructor(public name: string, public img: string) {
    }
  
    toDto() {
      return {
        name: this.name,
        img: this.img
      };
    }
  }
  
  function cardTypeFromDto(dto: any) {
    return new CardType(dto.name, dto.img);
  }
  
  class Action {
    constructor(public text: string, public func: string) {
    }
  }
  
  var cardCnt = 0;
  
  class Card {

    public type: CardType;
    public id: number;
    public tapped: boolean;
  
    constructor(type: CardType, id?: number, tapped?: boolean) {
      this.type = type;
      if (typeof id === 'undefined') {
        this.id = Math.floor(Math.random() * 10000) * 1000 + cardCnt++;
      } else {
        this.id = id;
      }
      if (typeof tapped === 'undefined') {
        this.tapped = false;
      } else {
        this.tapped = tapped;
      }
    }
  
    tap() {
      this.tapped = true;
    }
  
    untap() {
      this.tapped = false;
    }
  
    get name() {
      return this.type.name;
    }
  
    format() {
      let t = this.tapped ? ' tapped' : '';
      let f;
      if (this.type.img) {
        f = '<img class="card" src="' + this.type.img + '" />';
      } else {
        f = this.name;
      }
      return '<table class="card' + t + '"><tr><td>' + f + '</td></tr></table>';
    }
  
    getActions(currentPosition: string) {
      if (currentPosition === 'accessDenied') {
        return [];
      }
      let ret = [];
      if (currentPosition === 'table') {
        if (this.tapped) {
          ret.push(new Action('Enttappen', 'window.mrnOnline.gameField.untap(' + this.id + ')'));
        } else {
          ret.push(new Action('Tappen', 'window.mrnOnline.gameField.tap(' + this.id + ')'));
        }
      } else {
          ret.push(new Action('ins Spiel bringen', 'window.mrnOnline.gameField.putIntoPlay(' + this.id + ')'));
          ret.push(new Action('getappt ins Spiel bringen', 'window.mrnOnline.gameField.putIntoPlayTapped(' + this.id + ')'));
      }
      if (currentPosition !== 'graveyard') {
        ret.push(new Action('auf Friedhof legen', 'window.mrnOnline.gameField.putToGraveyard(' + this.id + ')'));
      }
      return ret;
    }
  
    toDto() {
      return {
        id: this.id,
        type: this.type.toDto(),
        tapped: this.tapped
      }
    }
  }

  interface DtoCardType {

  }

  interface DtoCard {
      type: DtoCardType;
      id: number;
      tapped: boolean;
  }
  
  function cardFromDto(dto: DtoCard) {
    return new Card(cardTypeFromDto(dto.type), dto.id, dto.tapped);
  }
  
  class CardCollection {
    constructor(public cards: Card[]) {
    }
  
    add(card: Card) {
      this.cards.push(card);
    }
  
    contains(cardId: number) {
      for (let i = 0; i < this.cards.length; i++) {
        if (this.cards[i].id === cardId) {
          return true;
        }
      }
      return false;
    }
  
    getById(cardId: number) {
      for (let i = 0; i < this.cards.length; i++) {
        if (this.cards[i].id === cardId) {
          return this.cards[i];
        }
      }
      return null;
    }
  
    remove(cardId: number) {
      for (let i = 0; i < this.cards.length; i++) {
        if (this.cards[i].id === cardId) {
          let card = this.cards[i];
          this.cards.splice(i, 1);
          return card;
        }
      }
      return null;
    }
  
    get size() {
      return this.cards.length;
    }
  
    formatAll(currentPosition: string) {
      let ret = '';
      this.cards.forEach(function (x) {
        ret += withDropdown(x.format(), x.getActions(currentPosition));
      });
      return ret;
    }
  
    toDto() {
      return this.cards.map(x => x.toDto());
    }
  }
  
  function withDropdown(content: string, actions: Action[]) {
    let ret = '<div class="dropdown">' + content + '<div class="dropdown-content">';
    for (let i = 0; i < actions.length; i++) {
      ret += '<a href="javascript:' + actions[i].func + '">' + actions[i].text + '</a>';
    }
    ret += '</div></div>';
    return ret;
  }
  
  class CardStash extends CardCollection {
    constructor(cards: Card[]) {
      super(cards);
    }
  
    shuffle() {
      var currentIndex = this.cards.length;
      var temporaryValue;
      var randomIndex;
  
      // While there remain elements to shuffle...
      while (0 !== currentIndex) {
  
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
  
        // And swap it with the current element.
        temporaryValue = this.cards[currentIndex];
        this.cards[currentIndex] = this.cards[randomIndex];
        this.cards[randomIndex] = temporaryValue;
      }
    }
  
    draw() {
      return this.cards.shift();
    }
  }
  
  class CardBag extends CardCollection {
    constructor(cards: Card[]) {
      super(cards);
    }
  }
  
  class SelfPlayer {
      public id: string;
      public name: string;
      public library: CardStash;
      public hand: CardBag;
      public table: CardBag;
      public graveyard: CardStash;
      public lifes: number;
      public color: string;
      public db: DistributedDatabaseSystem;

    constructor(id: string, name: string, deck: Card[], db: DistributedDatabaseSystem) {
      this.id = id;
      this.name = name;
      this.db = db;
      this.library = new CardStash(deck);
      this.library.shuffle();
      this.hand = new CardBag([]);
      this.table = new CardBag([]);
      this.graveyard = new CardStash([]);
      this.db.put('graveyards', this.id, this.graveyard.toDto());
      this.lifes = 20;
      this.db.put('lifes', this.id, this.lifes);
      this.color = 'hsl(' + (Math.floor(Math.random() * 72) * 5) + ',90%,40%)';
    }
  
    format() {
      let ret = '<div>Hand<br/>';
      ret += this.hand.formatAll('hand');
      ret += '</div>';
      ret += '<div>Ausgelegt:<br/>';
      ret += this.table.formatAll('table');
      ret += '</div>';
      ret += '<div>Bibliothek: ' + this.library.size + ' Karten. <a href="javascript:window.mrnOnline.gameField.drawCard()">Karte ziehen</a></div>';
      ret += '<div>Friedhof:<br/>';
      ret += this.graveyard.formatAll('graveyard');
      ret += '</div>';
      ret += '<div>Lebenspunkte: ' + this.lifes + ' <a href="javascript:window.mrnOnline.gameField.increaseLifes()">+</a> <a href="javascript:window.mrnOnline.gameField.decreaseLifes()">-</a></div>';
      return ret;
    }
  
    makeColored(tc: string, tr: string): MsgData {
        return {
            color: this.color,
            tc: tc,
            tr: tr
        }
    }
  
    drawCard() {
      let c = this.library.draw();
      if (!c) {
        this.sendNotification(this.name + ' kann nicht ziehen');
        return;
      }
      this.hand.add(c);
      this.sendNotification(this.name + ' zieht eine Karte');
    }
  
    changeLifeCount(diff: number) {
      this.lifes += diff;
      this.db.put('lifes', this.id, this.lifes);
      if (diff > 0) {
        this.sendNotification(this.name + ' erhöht Lebenspunkte um ' + diff + ' auf ' + this.lifes);
      } else {
        this.sendNotification(this.name + ' verringert Lebenspunkte um ' + -diff + ' auf ' + this.lifes);
      }
    }
  
    putToGraveyard(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      card.untap();
      this.graveyard.add(card);
      this.db.put('graveyards', this.id, this.graveyard.toDto());
      this.sendNotification(this.name + ' legt ' + card.name + ' auf Friedhof');
    }
  
    putIntoPlay(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      this.addToTable(card);
      this.sendNotification(this.name + ' spielt ' + card.name + ' aus');
    }
  
    putIntoPlayTapped(cardId: number) {
      let collData = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(collData, cardId);
      card.tap();
      this.addToTable(card);
      this.sendNotification(this.name + ' spielt ' + card.name + ' getappt aus');
    }
  
    removeFromCollection(collData: any, cardId: number) {
      let card = collData.obj.remove(cardId);
      if (collData.countOnly) {
        this.db.put(collData.name, this.id, collData.obj.size);
      } else {
        this.db.put(collData.name, this.id, collData.obj.toDto());
      }
      return card;
    }
  
    addToTable(card: Card) {
      this.table.add(card);
      this.db.put('tables', this.id, this.table.toDto());
    }
  
    getContainingCollection(cardId: number) {
      if (this.hand.contains(cardId)) {
        return {obj: this.hand, name: 'handSizes', countOnly: true};
      }
      if (this.table.contains(cardId)) {
        return {obj: this.table, name: 'tables', countOnly: false};
      }
      if (this.graveyard.contains(cardId)) {
        return {obj: this.graveyard, name: 'graveyards', countOnly: false};
      }
      if (this.library.contains(cardId)) {
        return {obj: this.library, name: 'librarySizes', countOnly: true};
      }
      return null;
    }
  
    tap(cardId: number) {
      let card = this.table.getById(cardId);
      if (!card) {
        return;
      }
      card.tap();
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification(this.name + ' tappt ' + card.name);
    }
  
    untap(cardId: number) {
      let card = this.table.getById(cardId);
      if (!card) {
        return;
      }
      card.untap();
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification(this.name + ' enttappt ' + card.name);
    }
  
    sendNotification(msg: string) {
      this.db.add('messages', this.makeColored(msg, ''));
    }
  
  }
  
  class OtherPlayer {
    constructor(public id: string, public db: DistributedDatabaseSystem) {
    }
  
    get name() {
      return this.db.get('playerNames', this.id);
    }
  
    get lifes() {
      return this.db.get('lifes', this.id);
    }
  
    get graveyard() {
      return this.getCardStash('graveyards');
    }
  
    get table() {
      return this.getCardStash('tables');
    }
  
    getCardStash(stashId: string) {
      let g: DtoCard[] = this.db.get(stashId, this.id);
      if (!g) {
        g = [];
      }
      return new CardStash(g.map(x => cardFromDto(x)));
    }
  
  }
  
  export interface MsgData {
      color: string;
      tc: string;
      tr: string;
  }
  
  class GameField {

    private db: DistributedDatabaseSystem;
    private others: OtherPlayer[];
    public myself: SelfPlayer;
  
    constructor(peer: any, ownId: string, ownName: string) {
      this.others = [];
      this.db = new DistributedDatabaseSystem(peer, ownId);
      var _this = this;
      this.db.on('add', 'playerNames', function(id: string, name: any) {_this.handleChangedPlayerName(id, name)});
      this.db.on('update', 'playerNames', function(id: string, name: any) {_this.handleChangedPlayerName(id, name)});
      this.db.on('update', 'lifes', function(id: undefined, cnt: any) {_this.updatePlayers()});
      this.db.on('update', 'graveyards', function(id: undefined, cards: any) {_this.updatePlayers()});
      this.db.on('update', 'tables', function(id: undefined, cards: any) {_this.updatePlayers()});
  
      this.myself = new SelfPlayer(ownId, ownName, window.mrnOnline.deck, this.db);
      this.db.put('playerNames', ownId, ownName);
    }

    registerMessageHandler(handler: Function) {
        this.db.on('add', 'messages', handler);
    }
  
    connectToOtherPlayer(id: string) {
      this.db.connectToNode(id);
      this.others.push(new OtherPlayer(id, this.db));
      this.updatePlayers();
    }
  
    addOtherPlayer(conn: any) {
      this.db.addNode(conn);
      this.others.push(new OtherPlayer(conn.peer, this.db));
      this.updatePlayers();
    }
  
    handleChangedPlayerName(id: string, name: string) {
      this.updatePlayers();
    }
  
    updatePlayers() {
      this.updateSelf();
      var content = '';
      this.others.forEach(function(x) {
        content += '<div id="' + x.name + '"><h2>' + x.name + ' (' + x.id + ')</h2></div>';
        content += x.lifes + ' Lebenspunkte<br/>';
        content += 'Ausgelegt:<br/>'
        content += x.table.formatAll('accessDenied');
        content += 'Friedhof:<br/>'
        content += x.graveyard.formatAll('accessDenied');
      });
      $('#players').html(content);
    }
  
    updateSelf() {
      $('#self').html(this.myself.format());
    }
  
    sendMessage(msg: string) {
      this.sendMessageRaw(this.myself.makeColored(this.myself.name, msg));
    }
  
    sendMessageRaw(msg: MsgData) {
      this.db.add('messages', msg);
    }
  
    drawCard() {
        this.myself.drawCard();
        this.updateSelf();
       }
       
       increaseLifes() {
        this.myself.changeLifeCount(1);
        this.updateSelf();
       }
       
       decreaseLifes() {
        this.myself.changeLifeCount(-1);
        this.updateSelf();
       }
       
       putToGraveyard(cardId: number) {
        this.myself.putToGraveyard(cardId);
        this.updateSelf();
       }
       
       tap(cardId: number) {
        this.myself.tap(cardId);
        this.updateSelf();
       }
       
       untap(cardId: number) {
        this.myself.untap(cardId);
        this.updateSelf();
       }
       
       putIntoPlay(cardId: number) {
        this.myself.putIntoPlay(cardId);
        this.updateSelf();
       }
       
       putIntoPlayTapped(cardId: number) {
        this.myself.putIntoPlayTapped(cardId);
        this.updateSelf();
       }   
    }

export { GameField, Card, CardType };
declare global {
    interface MrnOnline {
        deck: Card[];
        cards: CardType[];
        gameField: GameField;
    }
    interface MrnOnlineDuringInit {
        deck: Card[];
        cards: CardType[];
        gameField: GameField | undefined;
    }
    interface Window { mrnOnline: MrnOnline; mrnData: any}
}
