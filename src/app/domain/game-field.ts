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

  enum CardState {
    Normal,
    Blocker,
    Tapped
  }
  
  class Card {
    public type: CardType;
    public controllerId: string;
    public id: number;
    public state: CardState = CardState.Normal;
    private mods: Card[] = [];
  
    constructor(type: CardType, controllerId: string, id?: number, tapped?: boolean) {
      this.type = type;
      this.controllerId = controllerId;
      if (typeof id === 'undefined') {
        this.id = Math.floor(Math.random() * 10000) * 1000 + cardCnt++;
      } else {
        this.id = id;
      }
      if (typeof tapped === 'undefined') {
        this.state = CardState.Normal;
      } else {
        this.state = tapped ? CardState.Tapped : CardState.Normal;
      }
    }

    get tapped(): boolean {
      return this.state === CardState.Tapped;
    }
  
    get normal(): boolean {
      return this.state === CardState.Normal;
    }
  
    get markedAsBlocker(): boolean {
      return this.state === CardState.Blocker;
    }
  
    tap() {
      this.state = CardState.Tapped;
    }
  
    markAsBlocker() {
      if (this.state === CardState.Normal) {
        this.state = CardState.Blocker;
      }
    }
  
    untap() {
      this.state = CardState.Normal;
    }

    modifyWith(c: Card) {
      this.mods.push(c);
    }
  
    clearModifiers() {
      this.mods = [];
    }

    get name() {
      return this.type.name;
    }

    get img() {
      return this.type.img;
    }

    get isModified(): boolean {
      return this.mods.length > 0;
    }

    get reversedModifiers(): Card[] {
      return this.mods.slice().reverse();
    }

    get modifiers(): Card[] {
      return this.mods;
    }
  
    toDto() {
      return {
        id: this.id,
        cntr: this.controllerId,
        type: this.type.toDto(),
        tapped: this.tapped
      }
    }
  }

  interface DtoCardType {

  }

  interface DtoCard {
      type: DtoCardType;
      cntr: string;
      id: number;
      tapped: boolean;
  }
  
  function cardFromDto(dto: DtoCard) {
    return new Card(cardTypeFromDto(dto.type), dto.cntr, dto.id, dto.tapped);
  }
  
  export abstract class CardCollection implements Iterable<Card> {
    constructor(public cards: Card[]) {
    }

    [Symbol.iterator](): Iterator<Card, any, undefined> {
      return this.cards[Symbol.iterator]();
    }

    abstract add(card: Card): void;
  
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
  
    add(card: Card): void {
      this.cards.push(card);
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

    add(card: Card): void {
      let idx = this.cards.findIndex(x => x.type.name === card.type.name);
      if (idx < 0) {
        this.cards.push(card);
      } else {
        this.cards.splice(idx, 0, card);
      }
    }
  
  }
  
  class SelfPlayer {
      public id: string;
      public name: string;
      public library: CardStash;
      public hand: CardBag;
      public table: CardBag;
      public graveyard: CardStash;
      public exile: CardBag;
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
      this.db.put('librarySizes', this.id, this.library.size);
      this.hand = new CardBag([]);
      this.table = new CardBag([]);
      this.graveyard = new CardStash([]);
      this.db.put('graveyards', this.id, this.graveyard.toDto());
      this.exile = new CardBag([]);
      this.db.put('exiles', this.id, this.exile.toDto());
      this.lifes = 20;
      this.db.put('lifes', this.id, this.lifes);
      this.color = 'hsl(' + (Math.floor(Math.random() * 72) * 5) + ',90%,40%)';

      this.db.on('receiveCommand', 'putToGraveyard', (cardDto: DtoCard) => this.addToGraveyard(cardFromDto(cardDto)));
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

    untapAll() {
      this.table.cards.forEach(c => {
        if (!c.normal) {
          this.untap(c.id);
        }
      });
    }
  
    drawCard(cardId?: number | undefined) {
      let c;
      if (cardId) {
        let coll = this.getContainingCollection(cardId);
        c = this.removeFromCollection(coll, cardId);  
      } else {
        c = this.library.draw();
      }
      this.db.put('librarySizes', this.id, this.library.size);
      if (!c) {
        this.sendNotification('kann nicht ziehen');
        return;
      }
      this.addToHand(c);
      this.sendNotification('zieht eine Karte');
      this.subject.next();
    }

    shuffleLibrary() {
      this.sendNotification('mischt die Bibliothek');
      this.library.shuffle();
    }

    private addToHand(c: Card) {
      this.hand.add(c);
      this.db.put('handSizes', this.id, this.hand.size);
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
      this.addToGraveyard(card);
      this.subject.next();
    }

    private addToGraveyard(card: Card) {
      card.untap();
      if (this.id === card.controllerId) {
        this.graveyard.add(card);
        this.db.put('graveyards', this.id, this.graveyard.toDto());  
        this.sendNotification('legt ' + card.name + ' auf Friedhof');
      } else {
        this.db.sendCommandTo(card.controllerId, 'putToGraveyard', card.toDto());
      }
    }
  
    putToExile(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      card.untap();
      this.exile.add(card);
      this.db.put('exiles', this.id, this.exile.toDto());
      this.sendNotification('nimmt ' + card.name + ' ganz aus dem Spiel');
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
  
    putToHand(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      card.untap();
      this.addToHand(card);
      this.sendNotification('nimmt ' + card.name + ' auf die Hand');
      this.subject.next();
    }
  
    modifyOtherCard(modifierCardId: number, toModifyCardId: number) {
      let toModify = this.table.getById(toModifyCardId);
      if (!toModify) {
        return;
      }

      let collData = this.getContainingCollection(modifierCardId);
      let card = this.removeFromCollection(collData, modifierCardId);
      card.untap();

      toModify.modifyWith(card);
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification('spielt ' + card.name + ' auf ' + toModify.name);
      this.subject.next();
    }

    private removeFromCollection(collData: any, cardId: number) {
      let card = collData.obj.remove(cardId);
      if (collData.countOnly) {
        this.db.put(collData.name, this.id, collData.obj.size);
      } else {
        this.db.put(collData.name, this.id, collData.obj.toDto());
      }
      this.dropModifiers(card);
      return card;
    }

    private dropModifiers(c: Card) {
      c.modifiers.forEach(m => this.addToGraveyard(m));
      c.clearModifiers();
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
      if (this.exile.contains(cardId)) {
        return {obj: this.exile, name: 'exiles', countOnly: false};
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
  
    markAsBlocker(cardId: number) {
      let card = this.table.getById(cardId);
      if (!card) {
        return;
      }
      card.markAsBlocker();
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification('markiert ' + card.name + ' als Blocker');
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
      this.db.add('messages', this.makeColored(new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}) + ' ' + this.name + ' ' + msg, ''));
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
  
    get handSize(): number {
      return this.db.get('handSizes', this.id);
    }
  
    get librarySize(): number {
      return this.db.get('librarySizes', this.id);
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
  
    registerPlayerChangeHandler(handler: Function) {
      this.db.on('add', 'currentPlayer', handler);
      this.db.on('update', 'currentPlayer', handler);
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

    get currentPlayerName(): string|undefined {
      return this.db.get('currentPlayer', 'name');
    }

    shuffleStartPlayer() {
      let idx = Math.floor(Math.random() * (this.others.length + 1));
      if (idx === 0) {
        this.setCurrentPlayer(this.myself.name);
      } else {
        this.setCurrentPlayer(this.others[idx - 1].name);
      }
    }
  
    nextPlayer() {
      if (this.others.length === 0) {
        this.setCurrentPlayer(this.myself.name);
      } else {
        this.setCurrentPlayer(this.others[0].name);
      }
    }

    setCurrentPlayer(name: string) {
      this.db.put('currentPlayer', 'name', name);
      this.sendMessageRaw({color: 'black', tc: name + ' ist am Zug', tr: ''});
    }
  
    updatePlayer(id: string) {
      this.others.find(p => p.id === id)?.notifyUpdate();
    }
  
    sendMessage(msg: string) {
      this.sendMessageRaw(this.myself.makeColored(new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'}) + ' ' + this.myself.name, msg));
    }
  
    sendMessageRaw(msg: MsgData) {
      this.db.add('messages', msg);
    }
  
       increaseLifes() {
        this.myself.changeLifeCount(1);
       }
       
       decreaseLifes() {
        this.myself.changeLifeCount(-1);
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
