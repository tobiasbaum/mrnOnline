import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DistributedDatabaseSystem } from './distributed-database';

class CardType {

  public readonly img: string;
  public readonly token: boolean;

  constructor(public name: string, public type: string, img: string | undefined, token?: boolean) {
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

  toDto(): CardTypeDto {
    return {
      name: this.name,
      type: this.type,
      img: this.img,
      token: this.token
    }
  }

}

interface CardTypeDto {
  name: string;
  type: string;
  img: string;
  token: boolean | undefined;
}

function typeFromDto(dto: CardTypeDto) {
  return new CardType(dto.name, dto.type, dto.img, dto.token);
}

var cardCnt = 0;

enum LocationType {
  LIBRARY_OR_HAND,
  TABLE,
  ON_OTHER_CARD,
  GRAVEYARD,
  EXILE,
  VANISHED
}

enum CardState {
  Normal,
  Blocker,
  Tapped
}

interface ImmutableCardData {
  type: CardTypeDto;
  controller: string;
}

interface MutableCardData {
  state: CardState;
  locationPlayer: string;
  locationType: LocationType;
  locationData: number | undefined;
  counter: string | undefined;
}

class CachedCardsForPlayer {
  public library = new CardStash([]);
  public hand = new CardBag([]);
  public table = new CardBag([]);
  public graveyard = new CardStash([]);
  public exile = new CardBag([]);

  graveyardOrder = new Map<number, number | undefined>();

  public sortStashes(localLibrary: LocalLibrary) {
    this.library.sort(localLibrary.createOrderMap());
    this.graveyard.sort(this.graveyardOrder);
  }
}

export class LocalLibrary {
  public readonly content: number[] = [];

  constructor(private name: string, private storage: Storage, deck: Card[] | undefined) {
    if (deck) {
      console.log('initializing library from deck');
      this.content = deck.map(c => c.id);
      this.store();
    } else {
      let stored = storage.getItem('mrn.' + name + '.localLibrary');
      console.log('loaded stored library: ' + stored);
      if (stored) {
        this.content = JSON.parse(stored);
      } else {
        this.content = [];
      }
    }
  }

  contains(cardId: number): boolean {
    return this.content.includes(cardId);
  }

  shuffle() {
    var currentIndex = this.content.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = this.content[currentIndex];
      this.content[currentIndex] = this.content[randomIndex];
      this.content[randomIndex] = temporaryValue;
    }
    this.store();
  }

  createOrderMap(): Map<number, number | undefined> {
    let ret = new Map<number, number>();
    for (let i = 0; i < this.content.length; i++) {
      ret.set(this.content[i], i);
    }
    return ret;
  }

  draw(): number | undefined {
    let ret = this.content.shift();
    this.store();
    return ret;
  }

  putOnTop(cardId: number) {
    this.content.unshift(cardId);
    this.store();
  }

  private store() {
    this.storage.setItem('mrn.' + this.name + '.localLibrary', JSON.stringify(this.content));
  }
}

class CachedCards {
  private cardsPerPlayer: Map<string, CachedCardsForPlayer> = new Map();
  private mappedCards: Map<number, Card> = new Map();

  constructor(private db: DistributedDatabaseSystem, private library: LocalLibrary, knownCards: number[]) {
    knownCards.forEach((cardId: number) => {
      this.getOrCreateCard(cardId);
    });
    this.cardsPerPlayer.forEach(p => p.sortStashes(library));
  }

  public getOrCreateCard(cardId: number): Card {
    if (!this.mappedCards.has(cardId)) {
      this.mapCard(cardId, this.db.get('cardData', cardId));
    }
    return this.mappedCards.get(cardId) as Card;
  }

  private mapCard(cardId: number, data: MutableCardData | undefined) {
    let icd : ImmutableCardData = this.db.get('cards', cardId);
    if (!data) {
      data = {
        state: CardState.Normal,
        locationType: LocationType.LIBRARY_OR_HAND,
        locationPlayer: icd.controller,
        locationData: undefined,
        counter: undefined
      }
    }
    let card = new Card(typeFromDto(icd.type), icd.controller, cardId, data.state, [], data.counter);
    this.mappedCards.set(cardId, card);
    let player = this.getOrCreatePlayer(data.locationPlayer);
    switch (data.locationType) {
      case LocationType.LIBRARY_OR_HAND:
        //die Zuordnung Hand vs Bibliothek funktioniert nur für den eigenen Spieler, aber das ist OK
        if (this.library.contains(cardId)) {
          player.library.add(card);
        } else {
          player.hand.add(card);
        }
        break;
      case LocationType.TABLE:
        player.table.add(card);
        break;
      case LocationType.GRAVEYARD:
        player.graveyard.add(card);
        player.graveyardOrder.set(card.id, data.locationData);
        break;
      case LocationType.EXILE:
        player.exile.add(card);
        break;
      case LocationType.ON_OTHER_CARD:
        let otherCard = this.getOrCreateCard(data.locationData as number);
        otherCard?.modifyWith(card);
        break;
      case LocationType.VANISHED:
        break;
    }
  }

  public getOrCreatePlayer(playerName: string): CachedCardsForPlayer {
    if (!this.cardsPerPlayer.has(playerName)) {
      this.cardsPerPlayer.set(playerName, new CachedCardsForPlayer());
    }
    return this.cardsPerPlayer.get(playerName) as CachedCardsForPlayer;
  }
}

export class CardCache {
  private knownCards: number[];
  private dirty: boolean;
  private content: CachedCards | undefined;

  constructor(deck: Card[] | undefined, private db: DistributedDatabaseSystem, private library: LocalLibrary) {
    if (deck) {
      deck.forEach(c => c.writeCardStats(db));
      this.knownCards = deck.map(c => c.id);
    } else {
      this.knownCards = library.content.slice();
    }
    this.dirty = true;
    db.on('add', 'cardData', true, (cardId: number) => {
      this.ensureKnown(cardId);
      this.setDirty();
    });
    db.on('update', 'cardData', false, () => this.setDirty());
  }

  private ensureKnown(cardId: number) {
    if (!this.knownCards.includes(cardId)) {
      this.knownCards.push(cardId);
    }
  }

  public get(): CachedCards {
    if (this.dirty) {
      this.content = new CachedCards(this.db, this.library, this.knownCards);
      this.dirty = false;
    }
    return this.content as CachedCards;
  }

  public setDirty() {
    this.dirty = true;
  }

}

  class Card {
    public type: CardType;
    public controllerName: string;
    public id: number;
    public state: CardState = CardState.Normal;
    private mods: Card[];
    public counter: string | undefined;
  
    constructor(type: CardType, controllerName: string, id?: number, tapped?: CardState, mods?: Card[], counter?: string) {
      this.type = type;
      this.controllerName = controllerName;
      if (typeof id === 'undefined') {
        this.id = Math.floor(Math.random() * 10000) * 1000 + cardCnt++;
      } else {
        this.id = id;
      }
      if (typeof tapped === 'undefined') {
        this.state = CardState.Normal;
      } else {
        this.state = tapped;
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
  
    modifyWith(c: Card) {
      this.mods.push(c);
    }
  
    isModifiedBy(cardId: number): boolean {
      for (let i = 0; i < this.mods.length; i++) {
        if (this.mods[i].id === cardId) {
          return true;
        }
      }
      return false;
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

    writeCardStats(db: DistributedDatabaseSystem) {
      db.put('cards', this.id, {
        type: this.type.toDto(),
        controller: this.controllerName
      });
    }
  
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
  
    get size() {
      return this.cards.length;
    }
  
  }
  
  export class CardStash extends CardCollection {
    constructor(cards: Card[]) {
      super(cards);
    }
  
    add(card: Card): void {
      this.cards.push(card);
    }
  
    sort(cardIdToOrderMap: Map<number, number | undefined>) {
      this.cards.sort((c1, c2) => {
        let i1 = cardIdToOrderMap.get(c1.id) || 0;
        let i2 = cardIdToOrderMap.get(c2.id) || 0;
        return i1 - i2;
      })
    }
  }
  
  export class CardBag extends CardCollection {
    constructor(cards: Card[]) {
      super(cards);
    }

    add(card: Card): void {
      //bei gleichnamiger Karte einsortieren, wenn vorhanden
      let idx = this.cards.findIndex(x => x.type.name === card.type.name);
      if (idx >= 0) {
        this.cards.splice(idx, 0, card);
        return;
      }
      //nach Grob-Typ sortieren
      this.cards.push(card);
      this.cards.sort((a: Card, b: Card) => this.typeGroup(a) - this.typeGroup(b));
    }

    private typeGroup(c: Card): number {
      let t = c.type.type;
      if (t.startsWith('Creature') || t.startsWith('Summon ')) {
        return 1;
      } else if (t.indexOf('Land') >= 0) {
        return 0;
      } else {
        return 2;
      }
    }
  
  }
  
  class SelfPlayer implements PlayerData {
      public readonly id: string;
      public readonly name: string;
      private cardCache: CardCache;
      private localLibrary: LocalLibrary;
      public lifes: number;
      public readonly color: string;
      public readonly db: DistributedDatabaseSystem;
      public readonly orderNumber: number;
      private graveyardCounter: number = 0;
      private readonly subject: Subject<void> = new Subject();

    constructor(id: string, name: string, db: DistributedDatabaseSystem, cardCache: CardCache, localLibrary: LocalLibrary, clean: boolean) {
      this.id = id;
      this.name = name;
      this.db = db;
      this.cardCache = cardCache;
      this.localLibrary = localLibrary;
      if (clean) {
        this.db.put('librarySizes', this.name, this.library.size);
        this.db.put('lifes', this.name, 20);
        let h = Math.floor(Math.random() * 72) * 5;
        let s = 85 + Math.floor(Math.random() * 10);
        let l = 35 + Math.floor(Math.random() * 10);
        this.color = 'hsl(' + h + ',' + s + '%,' + l + '%)';
        this.orderNumber = Math.random();
      } else {
        let playerData: PlayerData = this.db.get('playerData', this.name);
        this.color = playerData.color;
        this.orderNumber = playerData.orderNumber;
      }
      this.lifes = this.db.get('lifes', this.name);

      this.db.on(['add', 'update'], 'endedPlayers', false, (name: string, dta: boolean) => { 
        if (dta) {
          this.handlePlayerEnd(name);
        }
      });
    }

    public get library(): CardStash {
      return this.cardCache.get().getOrCreatePlayer(this.name).library;
    }

    public get hand(): CardBag {
      return this.cardCache.get().getOrCreatePlayer(this.name).hand;
    }

    public get table(): CardBag {
      return this.cardCache.get().getOrCreatePlayer(this.name).table;
    }

    public get graveyard(): CardStash {
      return this.cardCache.get().getOrCreatePlayer(this.name).graveyard;
    }

    public get exile(): CardBag {
      return this.cardCache.get().getOrCreatePlayer(this.name).exile;
    }

    private handlePlayerEnd(playerName: string) {
      let allCardsOfPlayer: Card[] = [];
      this.table.cards.forEach((c: Card) => {
        if (c.controllerName === playerName) {
          allCardsOfPlayer.push(c);
        }
        c.modifiers.forEach((m: Card) => {
          if (m.controllerName === playerName) {
            allCardsOfPlayer.push(m);
          }
        });
      });
      allCardsOfPlayer.forEach(c => this.putToGraveyard(c.id));
      this.subject.next();
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

    get isInGame(): boolean {
      return !this.db.get('endedPlayers', this.name);
    }
  
    untapAll() {
      this.table.cards.forEach(c => {
        if (!c.normal) {
          this.untap(c.id);
        }
      });
    }
  
    drawCard(cardId?: number | undefined) {
      if (!cardId) {
        cardId = this.localLibrary.draw();
      }
      if (!cardId) {
        this.sendNotification('kann nicht ziehen');
        return;
      }
      let c = this.cardCache.get().getOrCreateCard(cardId);
      this.addToHand(c);
      this.db.put('librarySizes', this.name, this.library.size);
      this.sendNotification('zieht eine Karte');
      this.subject.next();
    }

    shuffleLibrary() {
      this.sendNotification('mischt die Bibliothek');
      this.localLibrary.shuffle();
      this.cardCache.setDirty();
    }

    private addToHand(c: Card) {
      this.writeCardData(c.id, {
        state: CardState.Normal,
        locationType: LocationType.LIBRARY_OR_HAND,
        locationPlayer: this.name,
        locationData: undefined,
        counter: undefined
      });
      this.db.put('handSizes', this.name, this.hand.size);
    }

    private writeCardData(cardId: number, mcd: MutableCardData) {
      this.db.put('cardData', cardId, mcd);
    }
  
    changeLifeCount(diff: number) {
      this.lifes += diff;
      this.db.put('lifes', this.name, this.lifes);
      if (diff > 0) {
        this.sendNotification('erhöht Lebenspunkte um ' + diff + ' auf ' + this.lifes);
      } else {
        this.sendNotification('verringert Lebenspunkte um ' + -diff + ' auf ' + this.lifes);
      }
      this.subject.next();
    }
  
    putToGraveyard(cardId: number) {
      this.addToGraveyard(this.cardCache.get().getOrCreateCard(cardId));
      this.subject.next();
    }

    private addToGraveyard(card: Card) {
      card.modifiers.forEach(m => this.addToGraveyard(m));

      this.writeCardData(card.id, {
        state: CardState.Normal,
        locationType: card.type.token ? LocationType.VANISHED : LocationType.GRAVEYARD,
        locationPlayer: card.controllerName,
        locationData: this.graveyardCounter--,
        counter: undefined
      });
      if (card.type.token) {
        this.sendNotification('Token ' + card.name + ' verschwindet');
      } else {
        this.sendNotification('legt ' + card.name + ' auf Friedhof');
      }
    }

    putToExile(cardId: number) {
      let card = this.cardCache.get().getOrCreateCard(cardId);
      this.writeCardData(card.id, {
        state: CardState.Normal,
        locationType: card.type.token ? LocationType.VANISHED : LocationType.EXILE,
        locationPlayer: card.controllerName,
        locationData: undefined,
        counter: undefined
      });
      if (card.type.token) {
        this.sendNotification('Token ' + card.name + ' verschwindet');
      } else {
        this.sendNotification('nimmt ' + card.name + ' ganz aus dem Spiel');
      }
      this.subject.next();
    }
  
    putIntoPlay(cardId: number) {
      this.writeCardData(cardId, {
        state: CardState.Normal,
        locationType: LocationType.TABLE,
        locationPlayer: this.name,
        locationData: undefined,
        counter: undefined
      });
      this.sendNotification('spielt ' + this.cardName(cardId) + ' aus');
      this.subject.next();
    }

    private cardName(cardId: number): string {
      return this.db.get('cards', cardId).type.name;
    }
  
    putIntoPlayTapped(cardId: number) {
      this.writeCardData(cardId, {
        state: CardState.Tapped,
        locationType: LocationType.TABLE,
        locationPlayer: this.name,
        locationData: undefined,
        counter: undefined
      });
      this.sendNotification('spielt ' + this.cardName(cardId) + ' getappt aus');
      this.subject.next();
    }
  
    putToHand(cardId: number) {
      this.writeCardData(cardId, {
        state: CardState.Normal,
        locationType: LocationType.LIBRARY_OR_HAND,
        locationPlayer: this.name,
        locationData: undefined,
        counter: undefined
      });
      this.sendNotification('nimmt ' + this.cardName(cardId) + ' auf die Hand');
      this.subject.next();
    }
  
    putOnLibrary(cardId: number) {
      let oldLocation : LocationType = this.db.get('cardData', cardId).locationType;
      if (oldLocation === LocationType.LIBRARY_OR_HAND) {
        this.sendNotification('legt eine Karte oben auf die Bibliothek');
      } else {
        this.writeCardData(cardId, {
          state: CardState.Normal,
          locationType: LocationType.LIBRARY_OR_HAND,
          locationPlayer: this.name,
          locationData: undefined,
          counter: undefined
        });
        this.sendNotification('legt ' + this.cardName(cardId) + ' oben auf die Bibliothek');
      }
      this.localLibrary.putOnTop(cardId);
      this.db.put('librarySizes', this.name, this.library.size);
      this.subject.next();
    }
  
    modifyCard(modifierCardId: number, toModifyCardId: number) {
      let cardData : MutableCardData = this.db.get('cardData', modifierCardId);
      this.writeCardData(modifierCardId, {
        state: CardState.Normal,
        locationType: LocationType.ON_OTHER_CARD,
        locationPlayer: cardData.locationPlayer,
        locationData: toModifyCardId,
        counter: cardData.counter
      });
      this.sendNotification('spielt ' + this.cardName(modifierCardId) + ' auf ' + this.cardName(toModifyCardId));
      this.subject.next();
    }

    setCounter(cardId: number, value: string | undefined) {
      let cardData : MutableCardData = this.db.get('cardData', cardId);
      this.writeCardData(cardId, {
        state: cardData.state,
        locationType: cardData.locationType,
        locationPlayer: cardData.locationPlayer,
        locationData: cardData.locationData,
        counter: value
      });
      this.sendNotification('setzt Counter für ' + this.cardName(cardId) + ' auf ' + value);
      this.subject.next();
    }

    addToTable(card: Card) {
      this.table.add(card);
      card.writeCardStats(this.db);
      this.writeCardData(card.id, {
        state: CardState.Normal,
        locationType: LocationType.TABLE,
        locationPlayer: this.name,
        locationData: undefined,
        counter: card.counter
      });
      this.subject.next();
    }

    tap(cardId: number) {
      this.setCardState(cardId, CardState.Tapped);
      this.sendNotification('tappt ' + this.cardName(cardId));
      this.subject.next();
    }
  
    markAsBlocker(cardId: number) {
      this.setCardState(cardId, CardState.Blocker);
      this.sendNotification('markiert ' + this.cardName(cardId) + ' als Blocker');
      this.subject.next();
    }
  
    untap(cardId: number) {
      this.setCardState(cardId, CardState.Normal);
      this.sendNotification('enttappt ' + this.cardName(cardId));
      this.subject.next();
    }

    private setCardState(cardId: number, state: CardState) {
      let cardData : MutableCardData = this.db.get('cardData', cardId);
      this.writeCardData(cardId, {
        state: state,
        locationType: cardData.locationType,
        locationPlayer: cardData.locationPlayer,
        locationData: cardData.locationData,
        counter: cardData.counter
      });
    }
  
    sendNotification(msg: string) {
      this.db.add('messages', this.makeColored(curTime() + ' ' + this.name + ' ' + msg, ''));
    }
  
    createToken(name: string) {
      let type = new CardType(name, 'Creature - Token', undefined, true);
      let card = new Card(type, this.name);
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

    constructor(public name: string, public db: DistributedDatabaseSystem, private cardCache: CardCache) {
      this.db.on(['add', 'update'], 'playerData', false, (playerName: string, name: any) => this.notifyIfRightName(playerName));
      this.db.on(['add', 'update'], 'lifes', false, (playerName: string, cnt: any) => this.notifyIfRightName(playerName));
      this.db.on(['add', 'update'], 'endedPlayers', false, (playerName: string, cnt: any) => this.notifyIfRightName(playerName));
    }

    private notifyIfRightName(playerName: string) {
      if (playerName === this.name) {
        this.notifyUpdate();
      }
    }
  
    get id(): string {
      return this.playerData?.id;
    }

    get orderNumber(): number {
      return this.playerData?.orderNumber;
    }

    get color(): string {
      return this.playerData?.color;
    }

    private get playerData(): PlayerData {
      return this.db.get('playerData', this.name);
    }

    get isInGame(): boolean {
      return !this.db.get('endedPlayers', this.name);
    }
  
    get lifes(): number {
      return this.db.get('lifes', this.name);
    }
  
    get handSize(): number {
      return this.db.get('handSizes', this.name);
    }
  
    get librarySize(): number {
      return this.db.get('librarySizes', this.name);
    }
  
    get graveyard() {
      return this.cardCache.get().getOrCreatePlayer(this.name).graveyard;
    }
  
    get table() {
      return this.cardCache.get().getOrCreatePlayer(this.name).table;
    }
  
    notifyUpdate() {
      console.log('notify update ' + this.name);
      this.subject.next();
    }
  
    subscribeForUpdate(arg0: () => void, destroy: Subject<void>) {
      this.subject.pipe(takeUntil(destroy)).subscribe(arg0);
    }

  }
  
  export interface MsgData {
      color: string;
      tc: string;
      tr: string;
  }
  
  class GameField {
    private db: DistributedDatabaseSystem;
    private cardCache: CardCache;
    public others: OtherPlayer[];
    public myself: SelfPlayer;

    constructor(peer: any, ownId: string, ownName: string, deck: Card[] | undefined, clean: boolean) {
      this.others = [];
      this.db = new DistributedDatabaseSystem(ownName, peer, ownId, localStorage, clean);
      let localLibrary = new LocalLibrary(ownName, localStorage, deck);
      if (clean) {
        localLibrary.shuffle();
      }
      this.cardCache = new CardCache(clean ? deck : undefined, this.db, localLibrary);
      this.db.on('add', 'playerData', true, (name: string, data: any) => {
        if (name !== ownName) {
          this.others.push(new OtherPlayer(name, this.db, this.cardCache));
        }
        this.ensurePlayersSorted();
      });
  
      this.myself = new SelfPlayer(ownId, ownName, this.db, this.cardCache, localLibrary, clean);
      this.db.put('playerData', ownName, {
        id: ownId,
        name: ownName,
        color: this.myself.color,
        orderNumber: this.myself.orderNumber
      });
    }

    registerMessageHandler(handler: Function) {
        this.db.on('add', 'messages', true, handler);
    }
  
    registerPlayerChangeHandler(handler: Function) {
      this.db.on('add', 'currentPlayer', true, handler);
      this.db.on('update', 'currentPlayer', false, handler);
  }

  connectToOtherPlayer(id: string) {
      this.db.connectToNode(id);
    }
  
    get currentPlayerName(): string|undefined {
      return this.db.get('currentPlayer', 'name');
    }

    shuffleStartPlayer() {
      this.ensurePlayersSorted();
      let inGame = this.allActivePlayers;
      let idx = Math.floor(Math.random() * inGame.length);
      this.setCurrentPlayer(inGame[idx].name);
    }

    nextPlayer() {
      this.ensurePlayersSorted();
      let inGame = this.others.filter(x => x.isInGame);
      let withLargerNumber = inGame.filter(x => x.orderNumber > this.myself.orderNumber);
      if (withLargerNumber.length > 0) {
        this.setCurrentPlayer(withLargerNumber[0].name);
      } else if (inGame.length === 0) {
        this.setCurrentPlayer(this.myself.name);
      } else {
        this.setCurrentPlayer(inGame[0].name);
      }
    }

    get allActivePlayers(): PlayerData[] {
      let ret = [this.myself, ...this.others].filter(x => x.isInGame);
      ret.sort((a, b) => a.orderNumber - b.orderNumber);
      return ret;
    }

    private ensurePlayersSorted() {
      this.others.sort((a, b) => a.orderNumber - b.orderNumber);
    }

    setCurrentPlayer(name: string) {
      this.db.put('currentPlayer', 'name', name);
      this.sendGlobalNotification(name + ' ist am Zug');
    }
  
    sendMessage(msg: string) {
      this.sendMessageRaw(this.myself.makeColored(curTime() + ' ' + this.myself.name, msg));
    }

    sendGlobalNotification(msg: string) {
      this.sendMessageRaw({color: 'black', tc: curTime() + ' ' + msg, tr: ''});
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
      this.myself.modifyCard(modifierCardId, targetId);
    }

    endGameForPlayer(nameOrId: string) {
      this.allActivePlayers.forEach(p => {
        if (p.id === nameOrId || p.name === nameOrId) {
          this.db.put('endedPlayers', p.name, true);
        }
      });
      this.sendGlobalNotification(nameOrId + ' verlässt das Spiel');
    }
  }

function curTime(): string {
  return new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute:'2-digit'});
}

export { GameField, Card, CardType };
