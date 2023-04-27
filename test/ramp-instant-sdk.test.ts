import { RampInstantSDK } from '../src/ramp-instant-sdk';

describe('Initialize test', () => {
  it("doesn't throw", () => {
    expect(
      () =>
        new RampInstantSDK({
          swapAmount: '100',
          swapAsset: 'ETH',
          hostAppName: 'Test',
          hostLogoUrl: 'http://localhost:8080/image.png',
        }),
    ).not.toThrow();
  });
});
