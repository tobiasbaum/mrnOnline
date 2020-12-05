import { DistributedDatabaseSystem } from "./distributed-database";

describe('DistributedDatabaseSystem', () => {

    let stubNetwork: StubNetwork;

    class StubNetwork {
        peers = new Map<string, StubPeer>();
        msg: any[] = [];
        handlers = new Map<string, StubConnection>();

        exchangeMessages() {
            let cnt = 0;
            while (this.msg.length > 0) {
                let m = this.msg.shift();
                m();
                cnt++;
            }
            console.log('exchanged ' + cnt + ' messages');
        }

        getOrCreateConnection(from: StubPeer, to: string) {
            let key = from.user + '->' + to;
            if (this.handlers.has(key)) {
                return this.handlers.get(key);
            }
            let c = new StubConnection(from, to);
            this.handlers.set(key, c);
            this.peers.get(to)?.connect(from.user, {});
            return c;
        }

    }

    class StubPeer {

        onConnection: any[] = [];

        constructor(public user: string, public network: StubNetwork) {
            network.peers.set(user, this);
        }

        connect(id: string, options: any) {
            this.network.msg.push(() => {this.network.handlers.get(this.user + '->' + id)?.onOpen.forEach(x => x())});
            let conn = this.network.getOrCreateConnection(this, id);
            this.network.msg.push(() => {this.onConnection.forEach(x => x(conn))});
            return conn;
        }

        on(t: string, f: any) {
            if (t === 'connection') {
                this.onConnection.push(f);
            }
        }
    }

    class StubConnection {
        onOpen: any[] = [];
        onData: any[] = [];

        constructor(public myself: StubPeer, public peer: string) {
        }

        on(t: string, f: any) {
            if (t === 'open') {
                this.onOpen.push(f);
            }
            if (t === 'data') {
                this.onData.push(f);
            }
        }

        send(data: any) {
            let nw = this.myself.network;
            nw.msg.push(() => {nw.handlers.get(this.peer + '->' + this.myself.user)?.onData.forEach(x => x(JSON.parse(JSON.stringify(data))))});
        }
    }

    beforeEach(() => {
        stubNetwork = new StubNetwork();
    });
  
    function createDBS(user: string): DistributedDatabaseSystem {
        let p = new StubPeer(user, stubNetwork);
        let dds = new DistributedDatabaseSystem(p, user);
        p.on('connection', (conn: any) => dds.addNode(conn));
        return dds;
    }
    
    it('should create', () => {
        let dbs = createDBS('user1');
        expect(dbs).toBeTruthy();
    });

    it('allows put and get', () => {
        let dbs = createDBS('user1');
        dbs.put('testdb', 'x', ['a', 'b']);
        expect(dbs.get('testdb', 'x')).toEqual(['a', 'b']);
        expect(dbs.get('testdb', 'y')).toBeUndefined();
    });

    it('keeps two peers in sync', () => {
        let dbs1 = createDBS('user1');
        let dbs2 = createDBS('user2');
        dbs1.connectToNode('user2');
        dbs1.put('testdb', 'x', ['a', 'b', 'c']);
        stubNetwork.exchangeMessages();
        expect(dbs1.get('testdb', 'x')).toEqual(['a', 'b', 'c']);
        expect(dbs2.get('testdb', 'x')).toEqual(['a', 'b', 'c']);
        dbs2.put('testdb', 'y', ['V', 'W']);
        stubNetwork.exchangeMessages();
        expect(dbs1.get('testdb', 'x')).toEqual(['a', 'b', 'c']);
        expect(dbs2.get('testdb', 'x')).toEqual(['a', 'b', 'c']);
        expect(dbs1.get('testdb', 'y')).toEqual(['V', 'W']);
        expect(dbs2.get('testdb', 'y')).toEqual(['V', 'W']);
    });

});