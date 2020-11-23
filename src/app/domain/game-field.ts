import { Subject } from 'rxjs';
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

    get img() {
      return this.type.img;
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
  
  class CardCollection implements Iterable<Card> {
    constructor(public cards: Card[]) {
    }

    [Symbol.iterator](): Iterator<Card, any, undefined> {
      return this.cards[Symbol.iterator]();
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
  
    toDto() {
      return this.cards.map(x => x.toDto());
    }
  }
  
  export class CardStash extends CardCollection {
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
  
  export class CardBag extends CardCollection {
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
      private subject: Subject<void> = new Subject();

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
  
    subscribeForUpdate(arg0: () => void): void {
      this.subject.subscribe(arg0);
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
        this.sendNotification('kann nicht ziehen');
        return;
      }
      this.hand.add(c);
      this.sendNotification('zieht eine Karte');
      this.subject.next();
    }
  
    changeLifeCount(diff: number) {
      this.lifes += diff;
      this.db.put('lifes', this.id, this.lifes);
      if (diff > 0) {
        this.sendNotification('erhöht Lebenspunkte um ' + diff + ' auf ' + this.lifes);
      } else {
        this.sendNotification('verringert Lebenspunkte um ' + -diff + ' auf ' + this.lifes);
      }
      this.subject.next();
    }
  
    putToGraveyard(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      card.untap();
      this.graveyard.add(card);
      this.db.put('graveyards', this.id, this.graveyard.toDto());
      this.sendNotification('legt ' + card.name + ' auf Friedhof');
      this.subject.next();
    }
  
    putIntoPlay(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      this.addToTable(card);
      this.sendNotification('spielt ' + card.name + ' aus');
      this.subject.next();
    }
  
    putIntoPlayTapped(cardId: number) {
      let collData = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(collData, cardId);
      card.tap();
      this.addToTable(card);
      this.sendNotification('spielt ' + card.name + ' getappt aus');
      this.subject.next();
    }
  
    private removeFromCollection(collData: any, cardId: number) {
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
      this.subject.next();
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
      this.sendNotification('tappt ' + card.name);
      this.subject.next();
    }
  
    untap(cardId: number) {
      let card = this.table.getById(cardId);
      if (!card) {
        return;
      }
      card.untap();
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification('enttappt ' + card.name);
      this.subject.next();
    }
  
    sendNotification(msg: string) {
      this.db.add('messages', this.makeColored(this.name + ' ' + msg, ''));
    }
  
  }
  
  export class OtherPlayer {
    private subject: Subject<void> = new Subject();

    constructor(public id: string, public db: DistributedDatabaseSystem) {
    }
  
    get name(): string {
      return this.db.get('playerNames', this.id);
    }
  
    get lifes(): number {
      return this.db.get('lifes', this.id);
    }
  
    get graveyard() {
      return this.getCardStash('graveyards');
    }
  
    get table() {
      return this.getCardStash('tables');
    }
  
    getCardStash(stashId: string): CardStash {
      let g: DtoCard[] = this.db.get(stashId, this.id);
      if (!g) {
        g = [];
      }
      return new CardStash(g.map(x => cardFromDto(x)));
    }

    notifyUpdate() {
      console.log('notify update ' + this.id);
      this.subject.next();
    }
  
    subscribeForUpdate(arg0: () => void) {
      this.subject.subscribe(arg0);
    }

  }
  
  export interface MsgData {
      color: string;
      tc: string;
      tr: string;
  }
  
  class GameField {
    private db: DistributedDatabaseSystem;
    public others: OtherPlayer[];
    public myself: SelfPlayer;
  
    constructor(peer: any, ownId: string, ownName: string) {
      this.others = [];
      this.db = new DistributedDatabaseSystem(peer, ownId);
      this.db.on('add', 'playerNames', (id: string, name: any) => this.updatePlayer(id));
      this.db.on('update', 'playerNames', (id: string, name: any) => this.updatePlayer(id));
      this.db.on('update', 'lifes', (id: string, cnt: any) => this.updatePlayer(id));
      this.db.on('update', 'graveyards', (id: string, cards: any) => this.updatePlayer(id));
      this.db.on('update', 'tables', (id: string, cards: any) => this.updatePlayer(id));
  
      this.myself = new SelfPlayer(ownId, ownName, window.mrnOnline.deck, this.db);
      this.db.put('playerNames', ownId, ownName);
    }

    registerMessageHandler(handler: Function) {
        this.db.on('add', 'messages', handler);
    }
  
    connectToOtherPlayer(id: string) {
      this.db.connectToNode(id);
      this.others.push(new OtherPlayer(id, this.db));
      //this.updatePlayers();
    }
  
    addOtherPlayer(conn: any) {
      this.db.addNode(conn);
      this.others.push(new OtherPlayer(conn.peer, this.db));
      //this.updatePlayers();
    }
  
    updatePlayer(id: string) {
      this.others.find(p => p.id === id)?.notifyUpdate();
    }
  
    sendMessage(msg: string) {
      this.sendMessageRaw(this.myself.makeColored(this.myself.name, msg));
    }
  
    sendMessageRaw(msg: MsgData) {
      this.db.add('messages', msg);
    }
  
    drawCard() {
        this.myself.drawCard();
       }
       
       increaseLifes() {
        this.myself.changeLifeCount(1);
       }
       
       decreaseLifes() {
        this.myself.changeLifeCount(-1);
       }
       
       putToGraveyard(cardId: number) {
        this.myself.putToGraveyard(cardId);
       }
       
       tap(cardId: number) {
        this.myself.tap(cardId);
       }
       
       untap(cardId: number) {
        this.myself.untap(cardId);
       }
       
       putIntoPlay(cardId: number) {
        this.myself.putIntoPlay(cardId);
       }
       
       putIntoPlayTapped(cardId: number) {
        this.myself.putIntoPlayTapped(cardId);
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