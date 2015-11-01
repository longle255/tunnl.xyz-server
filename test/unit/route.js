import request from 'supertest';
describe('Test suite for routes', function() {
  it('will test for access / as a guest ', function(done) {
    request(Tunnl.server.server)
      .get('/')
      .expect(200)
      .end(function(err, res) {
        expect(err).to.not.exist;
        done();
      });
  });

});
