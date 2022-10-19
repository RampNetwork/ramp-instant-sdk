import { getRandomIntString } from '../src/utils';

describe('utils tests', () => {
  it('getRandomIntString should return random int as a string', () => {
    expect(Number(getRandomIntString())).not.toBeNaN();
  });
});
