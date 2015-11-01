import path from 'path';
import fs from 'fs';
import Yaml from 'js-yaml';
import Logger from './logger';
import TunnlServer from './server';

let log = Logger.getLogger(module);

class Tunnl {
  constructor() {
    let rootDir = path.join(__dirname, '../');
    let configDir = path.join(rootDir, './config');
    let config = {};
    fs.readdirSync(configDir).forEach(file => {
      if (/\.yml$/.test(file)) {
        config[path.basename(file, '.yml')] = Yaml.safeLoad(fs.readFileSync(configDir + '/' + file, 'utf8'));
      }
    });
    this.rootDir = rootDir;
    this.srcDir = path.join(rootDir, './src');
    this.configDir = configDir;
    this.config = config;
    this.logger = Logger;
    this.tunnlServer = new TunnlServer(this.config.system.server);
  }

  start() {
    this.tunnlServer.start();
  }
}

export default new Tunnl();
