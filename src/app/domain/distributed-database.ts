class Database {

  private times: any;
  private data: any;

  constructor(private storage: Storage, private name: string) {
    let storedData = storage.getItem(name);
    if (storedData) {
      console.log('loading db ' + name + ' from local storage');
      let obj = JSON.parse(storedData);
      this.times = obj.times;
      this.data = obj.data;
    } else {
      this.times = {};
      this.data = {};  
    }
  }

  put(time: number, id: string, data: any) {
    if (id in this.times) {
      let lastTime = this.times[id];
      if (lastTime < time) {
        this.times[id] = time;
        this.data[id] = data;
        this.saveToStorage();
        return 'update';
      } else {
        return 'ignore';
      }
    } else {
      this.times[id] = time;
      this.data[id] = data;
      this.saveToStorage();
      return 'add';
    }
  }

  private saveToStorage() {
    let obj = {
      times: this.times,
      data: this.data
    }
    this.storage.setItem(this.name, JSON.stringify(obj));
  }

  get(id: string) {
    return this.data[id];
  }

  dumpEntries(conn: any, databaseName: string, sender: string, knownReceivers: string[]) {
    Object.keys(this.times).forEach(id => {
      let packet = {
        src: sender,
        t: this.times[id],
        rcv: knownReceivers,
        db: databaseName,
        id: id,
        dta: this.data[id]
      };
      conn.send(packet);
      console.log('dump ' + JSON.stringify(packet) + ' to ' + conn.peer);
    });
  }

  forEach(f: Function) {
    Object.keys(this.times).forEach(id => f(id, this.data[id]));
  }
}

export class DistributedDatabaseSystem {
  private systemName: string;
  private peer: any;
  private ownPeerId: string;
  private time: number;
  private otherNames: string[];
  private others: any[];
  private callbacks: any;
  private databases: any;
  private storage: Storage;

  constructor(systemName: string, peer: any, ownPeerId: string, storage: Storage, clean: boolean) {
    this.systemName = systemName;
    this.peer = peer;
    this.storage = storage;
    this.ownPeerId = ownPeerId;
    this.time = 0;
    this.otherNames = [];
    this.others = [];
    this.callbacks = {add: {}, update: {}, ignore: {}};
    this.databases = {};
    if (clean) {
      this.clear();
    } else {
      this.loadStoredData();
      this.connectToKnownPeers();
    }
    peer.on('connection', (conn: any) => this.addNode(conn));
  }

  private clear() {
    let knownDatabases = this.getStoredDatabaseNames();
    knownDatabases.forEach(key => this.storage.removeItem(this.systemName + '.' + key));
    this.storage.removeItem(this.systemName + '.meta.knownDatabases');
    this.storage.removeItem(this.systemName + '.meta.knownPeerIds');
  }

  private loadStoredData() {
    let databaseNames = this.getStoredDatabaseNames();
    databaseNames.forEach(dbName => this.openDb(dbName));
  }

  private getStoredDatabaseNames(): string[] {
    let dbs = this.storage.getItem(this.systemName + '.meta.knownDatabases');
    if (!dbs) {
      return [];
    }
    return JSON.parse(dbs);
  }

  private connectToKnownPeers() {
    let knownPeers = this.getStoredPeers();
    knownPeers.forEach(id => this.connectToNode(id));
  }

  private getStoredPeers(): string[] {
    let peers = this.storage.getItem(this.systemName + '.meta.knownPeerIds');
    if (!peers) {
      return [];
    }
    return JSON.parse(peers);
  }

  connectToNode(id: string) {
    console.log(this.ownPeerId + ' connects to ' + id);
    var conn = this.peer.connect(id, {reliable: true});
    this.addNode(conn);
  }

  private addNode(conn: any) {
    if (this.others.indexOf(conn) >= 0) {
      return;
    }
    console.log('node added to ' + this.ownPeerId + ': ' + conn.peer);
    this.otherNames.push(conn.peer);
    this.others.push(conn);
    this.storage.setItem(this.systemName + '.meta.knownPeerIds', JSON.stringify(this.otherNames));

    conn.on('data', (d: any) => this.handleData(d));
    conn.on('open', (d: any) => this.dumpDatabasesTo(conn));
  }

  private dumpDatabasesTo(conn: any) {
    for (let [name, db] of Object.entries(this.databases)) {
      (db as Database).dumpEntries(conn, name, this.ownPeerId, this.otherNames);
    }
  }

  private handleData(d: any) {
    console.log(this.ownPeerId + ' received: ' + JSON.stringify(d));
    this.time = Math.max(this.time, d.t);
    this.ensureDbExists(d.db);
    let eventType = this.databases[d.db].put(d.t, d.id, d.dta);
    if (this.callbacks[eventType][d.db]) {
      this.callbacks[eventType][d.db].forEach((f: Function) => f(d.id, d.dta));
    }
    if (eventType != 'ignore') {
      this.forwardToFurtherReceivers(d);
    }
    this.establishConnectionToUnknownNodes(d);
  }

  private ensureDbExists(dbName: string) {
    if (!this.databases[dbName]) {
      this.openDb(dbName);
      let knownDatabases = this.getStoredDatabaseNames();
      knownDatabases.push(dbName);
      this.storage.setItem(this.systemName + '.meta.knownDatabases', JSON.stringify(knownDatabases));
    }
  }

  private openDb(dbName: string) {
    this.databases[dbName] = new Database(this.storage, this.systemName + '.' + dbName);
  }

  private forwardToFurtherReceivers(packet: any) {
    let furtherReceivers: string[] = [];
    let existingSet = new Set(packet.rcv);
    existingSet.add(this.ownPeerId);
    existingSet.add(packet.src);
    this.otherNames.forEach(function (x) {
      if (!existingSet.has(x)) {
        furtherReceivers.push(x);
      }
    });
    packet.rcv.push(...furtherReceivers);
    let _this = this;
    furtherReceivers.forEach(function(id) {
      let index = _this.otherNames.indexOf(id);
      let conn = _this.others[index];
      conn.send(packet)
    });
  }

  private establishConnectionToUnknownNodes(packet: any) {
    let nameSet = new Set(this.otherNames);
    nameSet.add(this.ownPeerId);
    packet.rcv
      .filter((x: string) => !nameSet.has(x))
      .forEach((x: string) => this.connectToNode(x));
    if (!nameSet.has(packet.src)) {
      this.connectToNode(packet.src);
    }
  }

  add(listDb: string, data: any) {
    this.put(listDb, this.ownPeerId + this.time, data);
  }

  put(database: string, id: string | number, data: any) {
    var packet = {
      src: this.ownPeerId,
      t: this.time++,
      rcv: this.otherNames,
      db: database,
      id: id,
      dta: data
    };
    this.others.forEach(function(x: any) {
      x.send(packet);
    })
    this.handleData(packet);
  }

  get(database: string, id: string | number) {
    if (!this.databases[database]) {
      return undefined;
    }
    return this.databases[database].get(id);
  }

  on(eventType: string | string[], database: string, provideInitialData: boolean, action: Function) {
    if (typeof eventType !== 'string') {
      eventType.forEach(x => this.on(x, database, provideInitialData, action));
    } else {
      if (this.callbacks[eventType][database]) {
        this.callbacks[eventType][database].push(action);
      } else {
        this.callbacks[eventType][database] = [action];
      }
      if (provideInitialData) {
        let db: Database | undefined = this.databases[database];
        if (db) {
          db.forEach(action);
        }
      }
    }
  }

}

