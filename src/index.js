import path from 'path';
import Tunnl from './tunnl';
import _ from 'lodash';
import Promise from 'bluebird';

process.env.NODE_ENV = 'development';
process.env.TUNNL_LOG = 'debug';
process.env.TUNNL_ROOT_DIR = path.join(__dirname, '../');

// assign global variable
global.Promise = Promise;
global._ = _;
global.Tunnl = Tunnl;
Tunnl.start();
