import { StubNetwork, StubPeer } from './distributed-database.spec';
import { Card, CardType, GameField } from "./game-field";

describe('GameField', () => {

    let gf: GameField;

    beforeEach(() => {
        let deck = [
            new Card(new CardType('Forest', 'Land', undefined), 'p1', 1),
            new Card(new CardType('Island', 'Land', undefined), 'p1', 2),
            new Card(new CardType('Plains', 'Land', undefined), 'p1', 3)
        ];
        let stubNetwork = new StubNetwork();
        let peer = new StubPeer('xy123', stubNetwork);
        gf = new GameField(peer, 'xy123', 'p1', deck, true);
    });

    it('can be created', () => {
        expect(gf.myself.library.size).toEqual(3);
        expect(gf.myself.hand.size).toEqual(0);
    });

    it('can draw card', () => {
        gf.myself.drawCard();

        expect(gf.myself.library.size).toEqual(2);
        expect(gf.myself.hand.size).toEqual(1);
    });

    it('can draw specific card', () => {
        gf.myself.drawCard(2);

        expect(gf.myself.library.size).toEqual(2);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(1);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(3);
        expect(gf.myself.hand.size).toEqual(1);
        expect(gf.myself.hand.cards.map(c => c.id)).toContain(2);
    });

    it('can put directly from library into play', () => {
        gf.myself.putIntoPlay(2);

        expect(gf.myself.library.size).toEqual(2);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(1);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(3);
        expect(gf.myself.hand.size).toEqual(0);
        expect(gf.myself.table.size).toEqual(1);
        expect(gf.myself.table.cards.map(c => c.id)).toContain(2);
    });

    it('can put directly from library into play and back to hand', () => {
        gf.myself.putIntoPlay(2);
        gf.myself.putToHand(2);

        expect(gf.myself.library.size).toEqual(2);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(1);
        expect(gf.myself.library.cards.map(c => c.id)).toContain(3);
        expect(gf.myself.hand.size).toEqual(1);
        expect(gf.myself.hand.cards.map(c => c.id)).toContain(2);
        expect(gf.myself.table.size).toEqual(0);
    });
});
