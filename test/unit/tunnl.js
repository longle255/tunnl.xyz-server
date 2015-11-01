describe('Tunnl init test suite', function() {
  it('should have global variable exported', () => {
    expect(Tunnl).to.exist;
    expect(Tunnl.logger).to.exist;
    expect(Tunnl.config.system).to.exist;
  });
});
