import net from 'net';
import events from 'events';
import Logger from './logger';

let log = Logger.getLogger(module);
let EventEmitter = events.EventEmitter;

class Proxy extends EventEmitter {
  constructor(options, callback) {
    log.debug('create proxy with options', options);
    super();

    this.sockets = [];
    this.waiting = [];

    this.id = options.id;

    // default max is 10
    var maxTcpSockets = options.maxTcpSockets || 10;

    // new tcp server to service requests for this client
    this.clientServer = net.createServer();

    this.clientServer.on('error', err => {
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        return;
      }

      log.error(err);
    });

    // track initial user connection setup
    this.connTimeOut = null;

    // user has 5 seconds to connect before their slot is given up

    this.attempTerminateTcp();

    // no longer accepting connections for this id
    this.clientServer.on('close', this.cleanUp.bind(this));

    // new tcp connection from lt client
    this.clientServer.on('connection', socket => {
      // no more socket connections allowed
      if (this.sockets.length >= maxTcpSockets) {
        return socket.end();
      }

      log.debug('new connection on port: %s', this.id);

      // a single connection is enough to keep client id slot open
      clearTimeout(this.connTimeOut);

      socket.once('close', error => {
        log.debug('client %s closed socket (error: %s)', this.id, error);

        // what if socket was servicing a request at this time?
        // then it will be put back in available after right?

        // remove this socket
        var idx = this.sockets.indexOf(socket);
        if (idx >= 0) {
          this.sockets.splice(idx, 1);
        }

        // need to track total sockets, not just active available
        log.debug('remaining client sockets: %s', this.sockets.length);

        // no more sockets for this ident
        if (this.sockets.length === 0) {
          log.debug('all client(%s) sockets disconnected', this.id);
          this.attempTerminateTcp();
        }
      });

      // close will be emitted after this
      socket.on('error', err => {
        // we don't log here to avoid logging crap for misbehaving clients
        log.error(err);
        socket.destroy();
      });

      this.sockets.push(socket);

      var waitCallback = this.waiting.shift();
      if (waitCallback) {
        log.debug('handling queued request');
        this.nextSocket(waitCallback);
      }
    });

    this.clientServer.listen(() => {
      var port = this.clientServer.address().port;
      log.debug('tcp server listening on port: %d', port);

      callback(null, {
        // port for lt client tcp connections
        port: port,
        // maximum number of tcp connections allowed by lt client
        maxConnCount: maxTcpSockets
      });
    });
  }

  nextSocket(callback) {
    // socket is a tcp connection back to the user hosting the site
    var sock = this.sockets.shift();

    // TODO how to handle queue?
    // queue request
    if (!sock) {
      log.debug('no more client, queue callback');
      return this.waiting.push(callback);
    }

    var isDone = false;
    // put the socket back
    function done() {
      if (isDone) {
        throw new Error('done called multiple times');
      }

      isDone = true;
      if (!sock.destroyed) {
        log.debug('retuning socket');
        this.sockets.push(sock);
      }

      // no sockets left to process waiting requests
      if (this.sockets.length === 0) {
        return;
      }

      var wait = this.waiting.shift();
      log.debug('processing queued callback');
      if (wait) {
        return this.nextSocket(callback);
      }
    }

    log.debug('processing request');
    return callback(sock, done.bind(this));
  }

  cleanUp() {
    log.debug('closed tcp socket for client(%s)', this.id);
    clearTimeout(this.connTimeOut);

    // clear waiting by ending responses, (requests?)
    this.waiting.forEach(waiting => waiting(null));

    this.emit('end');
  }

  attempTerminateTcp() {
    clearTimeout(this.connTimeOut);
    this.connTimeOut = setTimeout(() => {
      // sometimes the server is already closed but the event has not fired?
      try {
        clearTimeout(this.connTimeOut);
        this.clientServer.close();
      } catch (err) {
        this.cleanUp();
      }
    }, 5000);
  }
}

export default Proxy;
