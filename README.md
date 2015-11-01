# tunnl.xyz-server
[![Travis build status](http://img.shields.io/travis/longle255/tunnl.xyz-server.svg?style=flat)](https://travis-ci.org/longle255/tunnl.xyz-server)
[![Code Climate](https://codeclimate.com/github/longle255/tunnl.xyz-server/badges/gpa.svg)](https://codeclimate.com/github/longle255/tunnl.xyz-server)
[![Test Coverage](https://codeclimate.com/github/longle255/tunnl.xyz-server/badges/coverage.svg)](https://codeclimate.com/github/longle255/tunnl.xyz-server)
[![Dependency Status](https://david-dm.org/longle255/tunnl.xyz-server.svg)](https://david-dm.org/longle255/tunnl.xyz-server)
[![devDependency Status](https://david-dm.org/longle255/tunnl.xyz-server/dev-status.svg)](https://david-dm.org/longle255/tunnl.xyz-server#info=devDependencies)

### Rewritten of [localtunnel-server](https://github.com/localtunnel/server) in es 6

localtunnel exposes your localhost to the world for easy testing and sharing! No need to mess with DNS or deploy just to have others test out your changes.

This repo is the server component. If you are just looking for the CLI localtunnel app, see (https://github.com/defunctzombie/localtunnel)

## overview ##

The default localtunnel client connects to the ```tunnl.xyz``` server. You can however easily setup and run your own server. In order to run your own localtunnel server you must ensure that your server can meet the following requirements:

* You can setup DNS entries for your domain.tld and for *.domain.tld (or sub.domain.tld and *.sub.domain.tld)
* The server can accept incoming TCP connections for any non-root TCP port (ports over 1000).

The above are important as the client will ask the server for a subdomain under a particular domain. The server will listen on any OS assigned TCP port for client connections

#### setup

```shell
// pick a place where the files will live
git clone https://github.com/longle255/tunnl.xyz-server
cd tunnl.xyz-server
npm install

// adjust config/system.yml config file


// server set to run on port 1234
./node_modules/babel/bin/babel-node.js src/index.js
```

The localtunnel server is now running and waiting for client requests on port 1234. You will most likely want to setup a reverse proxy to listen on port 80 (or start localtunnel on port 80 directly).

#### use your server

You can now use your domain with the ```--host``` flag for the ```lt``` client.
```shell
lt --host http://sub.example.tld:1234 --port 9000
```

You will be assigned a url similar to ```qdci.sub.example.com:1234```

If your server is being a reverse proxy (i.e. nginx) and is able to listen on port 80, then you do not need the ```:1234``` part of the hostname for the ```lt``` client
