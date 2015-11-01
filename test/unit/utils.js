import Utils from '../../src/utils';
import Logger from '../../src/logger';
var log = Logger.getLogger();

describe('Logger setup testcase', () => {
  it('should be able to get logger', () => {
    var clientId = Utils.randomString();
    log.info('generated clientId:', clientId);
    expect(clientId.length).to.equal(8);
  });
});
