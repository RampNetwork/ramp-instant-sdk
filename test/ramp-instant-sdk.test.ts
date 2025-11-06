import { RampInstantSDK } from '../src/ramp-instant-sdk';

describe('Initialize test', () => {
  it("doesn't throw with hostApiKey", () => {
    expect(
      () =>
        new RampInstantSDK({
          swapAmount: '100',
          swapAsset: 'ETH',
          hostAppName: 'Test',
          hostLogoUrl: 'http://localhost:8080/image.png',
          hostApiKey: 'test_api_key',
        })
    ).not.toThrow();
  });

  it("doesn't throw with url", () => {
    expect(
      () =>
        new RampInstantSDK({
          url: 'https://example.com/widget',
        })
    ).not.toThrow();
  });
});
