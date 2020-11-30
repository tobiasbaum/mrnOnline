class Database {

    private times: any;
    private data: any;

  constructor() {
    this.times = {};
    this.data = {};
  }

  put(time: number, id: string, data: any) {
    if (id in this.times) {
      let lastTime = this.times[id];
      if (lastTime < time) {
        this.times[id] = time;
        this.data[id] = data;
        return 'update';
      } else {
        return 'ignore';
      }
    } else {
      this.times[id] = time;
      this.data[id] = data;
      return 'add';
    }
  }

  get(id: string) {
    return this.data[id];
  }

  dumpEntries(conn: any, databaseName: string, sender: string, knownReceivers: string[]) {
      let _this = this;
    Object.keys(this.times).forEach(function (id) {
      let packet = {
        src: sender,
        t: _this.times[id],
        rcv: knownReceivers,
        db: databaseName,
        id: id,
        dta: _this.data[id]
      };
      conn.send(packet);
      console.log('dump ' + JSON.stringify(packet) + ' to ' + conn.peer);
    });
  }
}

export class DistributedDatabaseSystem {
  private peer: any;
  private ownName: string;
  private time: number;
  private otherNames: string[];
  private others: any[];
  private callbacks: any;
  private databases: any;

  constructor(peer: any, ownName: string) {
    this.peer = peer;
    this.ownName = ownName;
    this.time = 0;
    this.otherNames = [];
    this.others = [];
    this.callbacks = {add: {}, update: {}, ignore: {}, receiveCommand: {}};
    this.databases = {};
  }

  connectToNode(id: string) {
    var conn = this.peer.connect(id, {reliable: true});
    this.addNode(conn);
  }

  addNode(conn: any) {
    this.otherNames.push(conn.peer);
    this.others.push(conn);
    var _this = this;
    conn.on('data', function(d: any) {
      _this.handleData(d);
    });
    conn.on('open', function(d: any) {
      _this.dumpDatabasesTo(conn);
    });
  }

  private dumpDatabasesTo(conn: any) {
    for (let [name, db] of Object.entries(this.databases)) {
      (db as Database).dumpEntries(conn, name, this.ownName, this.otherNames);
    }
  }

  private handleData(d: any) {
    console.log('received: ' + JSON.stringify(d));
    if (d.cmd) {
      this.handleCommand(d);
      return;
    }
    this.time = Math.max(this.time, d.t);
    this.ensureDbExists(d.db);
    let eventType = this.databases[d.db].put(d.t, d.id, d.dta);
    if (this.callbacks[eventType][d.db]) {
      this.callbacks[eventType][d.db](d.id, d.dta);
    }
    if (eventType != 'ignore') {
      this.forwardToFurtherReceivers(d);
    }
    this.establishConnectionToUnknownNodes(d);
  }

  private handleCommand(d: any) {
    if (this.callbacks['receiveCommand'][d.cmd]) {
      this.callbacks['receiveCommand'][d.cmd](d.dta);
    }
  }

  private ensureDbExists(dbName: string) {
    if (!this.databases[dbName]) {
      this.databases[dbName] = new Database();
    }
  }

  private forwardToFurtherReceivers(packet: any) {
    let furtherReceivers: string[] = [];
    let existingSet = new Set(packet.rcv);
    existingSet.add(this.ownName);
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
    let _this = this;
    let nameSet = new Set(this.otherNames);
    nameSet.add(this.ownName);
    packet.rcv.filter((x: string) => !nameSet.has(x)).forEach(function (x: string) {
      _this.connectToNode(x);
    });
    if (!nameSet.has(packet.src)) {
      this.connectToNode(packet.src);
    }
  }

  add(listDb: string, data: any) {
    this.put(listDb, this.ownName + this.time, data);
  }

  put(database: string, id: string, data: any) {
    var packet = {
      src: this.ownName,
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

  get(database: string, id: string) {
    if (!this.databases[database]) {
      return undefined;
    }
    return this.databases[database].get(id);
  }

  on(eventType: string | string[], database: string, action: Function) {
    if (typeof eventType !== 'string') {
      eventType.forEach(x => this.on(x, database, action));
    } else {
      this.callbacks[eventType][database] = action;
    }
  }

  sendCommandTo(receiverId: string, command: string, data: any) {
    let idx = this.otherNames.indexOf(receiverId);
    this.others[idx].send({
      cmd: command,
      dta: data
    });
  }

}

