import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DistributedDatabaseSystem } from './distributed-database';

class CardType {

    public readonly img: string;
    public readonly token: boolean;

    constructor(public name: string, img: string | undefined, token?: boolean) {
      if (token) {
        this.token = true;
      } else {
        this.token = false;
      }
      if (img) {
        this.img = img;
      } else {
        this.img = 'data:image/svg+xml;base64,' + btoa(this.createSvg(name.replace(/[^a-zA-Z0-9 ]/, '')));
      }
    }

    private createSvg(title: string): string {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 334"><rect x="5" y="5" width="230" height="324" fill="gray" /><text x="20" y="35">' + title + '</text></svg>';
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
    private mods: Card[];
    public counter: string | undefined;
  
    constructor(type: CardType, controllerId: string, id?: number, tapped?: boolean, mods?: Card[], counter?: string) {
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
      if (typeof mods === 'undefined') {
        this.mods = [];
      } else {
        this.mods = mods;
      }
      this.counter = counter;
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

    isModifiedBy(cardId: number): boolean {
      for (let i = 0; i < this.mods.length; i++) {
        if (this.mods[i].id === cardId) {
          return true;
        }
      }
      return false;
    }

    removeModifier(cardId: number): Card | null {
      for (let i = 0; i < this.mods.length; i++) {
        if (this.mods[i].id === cardId) {
          let card = this.mods[i];
          this.mods.splice(i, 1);
          return card;
        }
      }
      return null;
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
  
    toDto(): DtoCard {
      return {
        id: this.id,
        cntr: this.controllerId,
        type: this.type.toDto(),
        tapped: this.tapped,
        mods: this.mods.map(x => x.toDto()),
        counter: this.counter
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
      mods: DtoCard[];
      counter: string | undefined;
  }
  
  function cardFromDto(dto: DtoCard): Card {
    return new Card(cardTypeFromDto(dto.type), dto.cntr, dto.id, dto.tapped, dto.mods.map(cardFromDto), dto.counter);
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
      this.cards.unshift(card);
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
  
  class SelfPlayer implements PlayerData {
      public readonly id: string;
      public readonly name: string;
      public readonly library: CardStash;
      public readonly hand: CardBag;
      public readonly table: CardBag;
      public readonly graveyard: CardStash;
      public readonly exile: CardBag;
      public lifes: number;
      public readonly color: string;
      public readonly db: DistributedDatabaseSystem;
      public readonly orderNumber: number;
      private readonly subject: Subject<void> = new Subject();

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
      this.orderNumber = Math.random();

      this.db.on('receiveCommand', 'putToGraveyard', (cardDto: DtoCard) => this.addToGraveyard(cardFromDto(cardDto)));
      this.db.on('receiveCommand', 'modifyCard', (x: any) => this.modifyWithOthersCard(x.tgt, cardFromDto(x.card)));
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
      if (card.type.token) {
        this.sendNotification('Token ' + card.name + ' verschwindet');
        return;
      }
      this.clearCardState(card);
      if (this.id === card.controllerId) {
        this.graveyard.add(card);
        this.db.put('graveyards', this.id, this.graveyard.toDto());  
        this.sendNotification('legt ' + card.name + ' auf Friedhof');
      } else {
        this.db.sendCommandTo(card.controllerId, 'putToGraveyard', card.toDto());
      }
    }

    private clearCardState(card: Card) {
      card.untap();
      card.counter = undefined;
    }
  
    putToExile(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      if (card.type.token) {
        this.sendNotification('Token ' + card.name + ' verschwindet');
        return;
      }
      this.clearCardState(card);
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
      this.clearCardState(card);
      this.addToHand(card);
      this.sendNotification('nimmt ' + card.name + ' auf die Hand');
      this.subject.next();
    }
  
    putOnLibrary(cardId: number) {
      let coll = this.getContainingCollection(cardId);
      let card = this.removeFromCollection(coll, cardId);
      this.clearCardState(card);
      this.library.add(card);
      this.db.put('librarySizes', this.id, this.library.size);
      if (coll?.countOnly) {
        this.sendNotification('legt eine Karte oben auf die Bibliothek');
      } else {
        this.sendNotification('legt ' + card.name + ' oben auf die Bibliothek');
      }
      this.subject.next();
    }
  
    modifyOwnCard(modifierCardId: number, toModifyCardId: number) {
      let toModify = this.table.getById(toModifyCardId);
      if (!toModify) {
        return;
      }

      let collData = this.getContainingCollection(modifierCardId);
      let card = this.removeFromCollection(collData, modifierCardId);
      this.applyModification(toModify, card);
    }

    setCounter(cardId: number, value: string | undefined) {
      let card = this.table.getById(cardId);
      if (!card) {
        return;
      }
      card.counter = value;
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification('setzt Counter für ' + card.name + ' auf ' + value);
      this.subject.next();
    }

    modifyOtherPlayersCard(modifierCardId: number, toModifyCardId: number, otherPlayerId: string) {
      let collData = this.getContainingCollection(modifierCardId);
      let card = this.removeFromCollection(collData, modifierCardId);
      this.db.sendCommandTo(otherPlayerId, 'modifyCard', {tgt: toModifyCardId, card: card.toDto()});
    }

    private modifyWithOthersCard(toModifyCardId: number, card: Card) {
      let toModify = this.table.getById(toModifyCardId);
      if (!toModify) {
        return;
      }

      this.applyModification(toModify, card);
    }

    private applyModification(toModify: Card, card: Card) {
      card.untap();
      toModify.modifyWith(card);
      this.db.put('tables', this.id, this.table.toDto());
      this.sendNotification('spielt ' + card.name + ' auf ' + toModify.name);
      this.subject.next();
    }
    
    private removeFromCollection(collData: any, cardId: number) {
      let card;
      if (collData.nestedIn) {
        card = collData.nestedIn.removeModifier(cardId);
      } else {
        card = collData.obj.remove(cardId);
        this.dropModifiers(card);  
      }
      if (collData.countOnly) {
        this.db.put(collData.name, this.id, collData.obj.size);
      } else {
        this.db.put(collData.name, this.id, collData.obj.toDto());
      }
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
      let nested = this.table.cards.filter(c => c.isModifiedBy(cardId));
      if (nested.length > 0) {
        return {obj: this.table, name: 'tables', countOnly: false, nestedIn: nested[0]};
      }
      return null;
    }

    hasCard(cardId: number) {
      return this.getContainingCollection(cardId) !== null;
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
      this.db.add('messages', this.makeColored(curTime() + ' ' + this.name + ' ' + msg, ''));
    }
  
    createToken(name: string) {
      let type = new CardType(name, undefined, true);
      let card = new Card(type, this.id);
      this.sendNotification('bringt Token ' + card.name + ' ins Spiel');
      this.addToTable(card);
    }
  }

  interface PlayerData {
    id: string,
    name: string,
    color: string,
    orderNumber: number;
  }
  
  export class OtherPlayer implements PlayerData {
    private subject: Subject<void> = new Subject();
    private cachedGraveyard: CardStash = new CardStash([]);
    private cachedTable: CardStash = new CardStash([]);;

    constructor(public id: string, public db: DistributedDatabaseSystem) {
      db.on(['add', 'update'], 'graveyards', (playerId: string, content: DtoCard[]) => {
        if (playerId === this.id) {
          this.cachedGraveyard = this.map(content);
          this.notifyUpdate();
        }
      });
      db.on(['add', 'update'], 'tables', (playerId: string, content: DtoCard[]) => {
        if (playerId === this.id) {
          this.cachedTable = this.map(content);
          this.notifyUpdate();
        }
      });
    }
  
    get name(): string {
      return this.playerData?.name;
    }

    get orderNumber(): number {
      return this.playerData?.orderNumber;
    }

    get color(): string {
      return this.playerData?.color;
    }

    private get playerData(): PlayerData {
      return this.db.get('playerData', this.id);
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
      return this.cachedGraveyard;
    }
  
    get table() {
      return this.cachedTable;
    }
  
    private map(data: DtoCard[]): CardStash {
      return new CardStash(data.map(x => cardFromDto(x)));
    }

    notifyUpdate() {
      console.log('notify update ' + this.id);
      this.subject.next();
    }
  
    subscribeForUpdate(arg0: () => void, destroy: Subject<void>) {
      this.subject.pipe(takeUntil(destroy)).subscribe(arg0);
    }

    hasCard(cardId: number): boolean {
      return this.table.contains(cardId);
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
  
    constructor(peer: any, ownId: string, ownName: string, deck: Card[]) {
      this.others = [];
      this.db = new DistributedDatabaseSystem(peer, ownId);
      this.db.on('add', 'playerData', (id: string, name: any) => this.updatePlayer(id));
      this.db.on('update', 'playerData', (id: string, name: any) => this.updatePlayer(id));
      this.db.on('update', 'lifes', (id: string, cnt: any) => this.updatePlayer(id));
      this.db.on('update', 'graveyards', (id: string, cards: any) => this.updatePlayer(id));
      this.db.on('update', 'tables', (id: string, cards: any) => this.updatePlayer(id));
  
      this.myself = new SelfPlayer(ownId, ownName, deck, this.db);
      this.db.put('playerData', ownId, {
        name: ownName,
        color: this.myself.color,
        orderNumber: this.myself.orderNumber
      });
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
      this.ensurePlayersSorted();
      let withLargerNumber = this.others.filter(x => x.orderNumber > this.myself.orderNumber);
      if (withLargerNumber.length > 0) {
        this.setCurrentPlayer(withLargerNumber[0].name);
      } else if (this.others.length === 0) {
        this.setCurrentPlayer(this.myself.name);
      } else {
        this.setCurrentPlayer(this.others[0].name);
      }
    }

    get allPlayers(): PlayerData[] {
      let ret = [this.myself, ...this.others];
      ret.sort((a, b) => a.orderNumber - b.orderNumber);
      return ret;
    }

    private ensurePlayersSorted() {
      this.others.sort((a, b) => a.orderNumber - b.orderNumber);
    }

    setCurrentPlayer(name: string) {
      this.db.put('currentPlayer', 'name', name);
      this.sendMessageRaw({color: 'black', tc: curTime() + ' ' + name + ' ist am Zug', tr: ''});
    }
  
    updatePlayer(id: string) {
      this.ensurePlayersSorted();
      this.others.find(p => p.id === id)?.notifyUpdate();
    }
  
    sendMessage(msg: string) {
      this.sendMessageRaw(this.myself.makeColored(curTime() + ' ' + this.myself.name, msg));
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
       
    modifyOtherCard(modifierCardId: number, targetId: number) {
      if (this.myself.hasCard(targetId)) {
        this.myself.modifyOwnCard(modifierCardId, targetId);
      } else {
        this.others.forEach(p => {
          if (p.hasCard(targetId)) {
            this.myself.modifyOtherPlayersCard(modifierCardId, targetId, p.id);
          }
        });
      }
    }
  }

function curTime(): string {
  return new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'});
}

export { GameField, Card, CardType };
