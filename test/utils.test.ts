import { concatRelativePath } from '../src/utils';

describe('Utils', () => {
  describe('concatRelativePath', () => {
    it('No slashes', () =>
      expect(concatRelativePath('https://buy.ramp.network', 'api/swap').href).toBe(
        'https://buy.ramp.network/api/swap'
      ));

    it('Both slashes', () =>
      expect(concatRelativePath('https://buy.ramp.network/api/', '/swap').href).toBe(
        'https://buy.ramp.network/api/swap'
      ));
  });
});
