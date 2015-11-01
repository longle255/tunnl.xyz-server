import Chance from 'chance';
class Utils {
  constructor() {
    this.chance = new Chance();
  }

  randomString() {
    return this.chance.string({
      pool: 'abcdefghijklmnopqrstuvwxyz0123456789',
      length: 8
    });
  }
}

export default new Utils();
