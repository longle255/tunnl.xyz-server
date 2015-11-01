import Logger from '../../src/logger';

describe('Logger setup testcase', () => {
  it('should be able to get logger', () => {
    var log = Logger.getLogger();
    expect(log).to.be.exist;
    expect(() => {
      log.info('test');
    }).to.not.throw(Error);

  });
});
