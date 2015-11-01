import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import onFinished from 'on-finished';
import fs from 'fs';
import Logger from './logger';
import setRoute from './route';
import Proxy from './proxy';
import Utils from './utils';
import bouncy from 'bouncy';
import bodyParser from 'body-parser';
let log = Logger.getLogger(module);

class TunnlServer {
  constructor(options) {
    this.options = options || {};
    let server = express();
    server.use(cors());
    server.use(helmet());
    server.use(bodyParser.json());
    this.server = server;
    setRoute(this);
    this.clients = {};
    this.stats = {
      tunnels: 0
    };
    this.socketServer = bouncy((req, res, bounce) => {
      log.debug('request %s', req.url);
      // if we should bounce this request, then don't send to our server
      if (this.shouldForwardSocket(req, res, bounce)) {
        return;
      }
      bounce(this.options.webPort);
    });
  }

  start(callback) {
    this.server.listen(this.options.webPort, err => {
      if (err) {
        return log.err(err);
      }
      log.info('http server started on port ', this.options.webPort);
      this.socketServer.listen(this.options.port, err1 => {
        if (err1) {
          return log.err(err1);
        }
        log.info('socket server started on port ', this.options.port);
      });
    });
  }
  isIdAvailable(clientId) {
    return this.clients[clientId] ? false : true;
  }

  genClientId() {
    let id = Utils.randomString();
    while (!this.isIdAvailable(id)) {
      id = Utils.randomString();
    }
    return id;
  }

  createClient(clientId, callback) {
    let options = {
      id: clientId,
      maxTcpSockets: this.options.maxTcpSockets
    };

    let client = new Proxy(options, (err, data) => {
      if (err) {
        return callback(err);
      }
      this.stats.tunnels++;
      this.clients[clientId] = client;
      data.clientId = clientId;
      return callback(err, data);
    });

    client.on('end', () => {
      log.debug('Closing client connection...');
      this.stats.tunnels--;
      delete this.clients[clientId];
    });
  }

  shouldForwardSocket(req, res, bounce) {
    // without a hostname, we won't know who the request is for
    let hostname = req.headers.host;
    if (!hostname) {
      return false;
    }
    let reg = '([.a-z0-9/-]+)';
    if (this.options.subdomain) {
      reg += '\\.' + this.options.subdomain;
    }
    reg += '\\.' + this.options.address;
    let clientId = hostname.match(reg, /g/) ? hostname.match(reg, /g/)[1] : clientId;
    if (!clientId || (this.options.subdomain && (clientId === this.options.subdomain))) {
      return false;
    }

    let client = this.clients[clientId];

    // no such subdomain
    // we use 502 error to the client to signify we can't service the request
    if (!client) {
      res.statusCode = 502;
      res.end('localtunnel error: no active client for \'' + clientId + '\'');
      req.connection.destroy();
      return true;
    }

    // flag if we already finished before we get a socket
    // we can't respond to these requests
    let finished = false;
    onFinished(res, err => {
      if (err) {
        return log.error(err);
      }
      if (req.headers.upgrade === 'websocket') {
        return;
      }

      finished = true;
      req.connection.destroy();
    });

    // get client port
    client.nextSocket((socket, done) => {
      done = done || function() {};

      // the request already finished or client disconnected
      if (finished) {
        return done();
      } else if (!socket) {
        // happens when client upstream is disconnected
        // we gracefully inform the user and kill their conn
        // without this, the browser will leave some connections open
        // and try to use them again for new requests
        // we cannot have this as we need bouncy to assign the requests again
        res.statusCode = 504;
        res.end();
        req.connection.destroy();
        return;
      }

      let stream = bounce(socket, {
        headers: {
          connection: 'close'
        }
      });

      stream.on('error', (err) => {
        log.error(err);
        socket.destroy();
        req.connection.destroy();
        done();
      });

      // return the socket to the client pool
      stream.once('end', () => {
        done();
      });

      onFinished(res, (err) => {
        if (err) {
          req.connection.destroy();
          socket.destroy();
          return done();
        }
      });
    });

    return true;
  }

}

export default TunnlServer;
