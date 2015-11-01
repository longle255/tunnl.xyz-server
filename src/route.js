import express from 'express';
import Utils from './utils';
import Logger from './logger';
import HttpProxy from 'http-proxy';

let log = Logger.getLogger(module);

let router = express.Router();

let proxy = HttpProxy.createProxyServer({
  target: 'http://localtunnel.github.io'
});

proxy.on('error', function(err) {
  log.error(err);
});

proxy.on('proxyReq', function(proxyReq, req, res, options) {
  // rewrite the request so it hits the correct url on github
  // also make sure host header is what we expect
  proxyReq.path = '/www' + proxyReq.path;
  proxyReq.setHeader('host', 'localtunnel.github.io');
});

export default server => {
  var app = server.server;
  app.use('/', router);

  router.post('/', (req, res, next) => {
    let clientId = req.body.requestedId;
    log.debug('clientId', clientId);
    if (clientId && !server.isIdAvailable(clientId)) {
      return res.status(400).send('requested id is not available');
    } else if (!clientId) {
      clientId = server.genClientId();
    }
    log.debug('making new client with id %s', clientId);

    server.createClient(clientId, function(err, info) {
      if (err) {
        return res.status(500).send(err.message);
      }
      info.url = 'http' + '://' + clientId + '.' + req.headers.host;
      return res.json(info);
    });
  });

  app.get('/', (req, res, next) => {
    proxy.web(req, res);
  });

  app.get('/assets/*', (req, res, next) => {
    proxy.web(req, res);
  });

  app.get('/favicon.ico', (req, res, next) => {
    proxy.web(req, res);
  });

  app.use((err, req, res, next) => {
    var status = err.statusCode || err.status || 500;
    res.status(status).json({
      message: err.message
    });
  });
};
