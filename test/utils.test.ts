import { concatRelativePath } from '../src/utils';

describe('Utils', () => {
  describe('concatRelativePath', () => {
    it('Without leading and trailing slash', () =>
      expect(concatRelativePath('https://buy.ramp.network', 'api/swap').href).toBe(
        'https://buy.ramp.network/api/swap'
      ));

    it('With leading and trailing slash', () =>
      expect(concatRelativePath('https://buy.ramp.network/api/', '/swap').href).toBe(
        'https://buy.ramp.network/api/swap'
      ));
  });
});
