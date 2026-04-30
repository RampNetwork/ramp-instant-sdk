import { initWidgetIframeUrl, readParentAmplitudeIdentity } from '../src/init-helpers';
import { RampInstantSDK } from '../src/ramp-instant-sdk';
import { IHostConfigWithSdkParams } from '../src/types';

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

describe('readParentAmplitudeIdentity', () => {
  const originalAmplitude = (window as any).amplitude;

  afterEach(() => {
    (window as any).amplitude = originalAmplitude;
  });

  it('returns empty when window.amplitude is missing', () => {
    delete (window as any).amplitude;
    expect(readParentAmplitudeIdentity()).toEqual({});
  });

  it('returns deviceId and sessionId when Amplitude exposes them', () => {
    (window as any).amplitude = {
      getDeviceId: () => 'device-abc',
      getSessionId: () => 1700000000000,
    };
    expect(readParentAmplitudeIdentity()).toEqual({
      deviceId: 'device-abc',
      sessionId: 1700000000000,
    });
  });

  it('drops invalid values silently', () => {
    (window as any).amplitude = {
      getDeviceId: () => '',
      getSessionId: () => Number.NaN,
    };
    expect(readParentAmplitudeIdentity()).toEqual({});
  });

  it('never throws when getters throw', () => {
    (window as any).amplitude = {
      getDeviceId: () => {
        throw new Error('boom');
      },
      getSessionId: () => 1700000000000,
    };
    expect(() => readParentAmplitudeIdentity()).not.toThrow();
    expect(readParentAmplitudeIdentity()).toEqual({});
  });
});

describe('initWidgetIframeUrl with useParentAmplitudeIdentity', () => {
  const originalAmplitude = (window as any).amplitude;
  const baseConfig: IHostConfigWithSdkParams = {
    url: 'https://example.com/widget',
    sdkType: 'WEB',
    sdkVersion: '0.0.0-test',
    widgetInstanceId: '12345',
    variant: 'desktop',
  };

  afterEach(() => {
    (window as any).amplitude = originalAmplitude;
  });

  it('does not append client/profile when the flag is off', () => {
    (window as any).amplitude = {
      getDeviceId: () => 'device-abc',
      getSessionId: () => 1700000000000,
    };

    const url = new URL(initWidgetIframeUrl(baseConfig));
    expect(url.searchParams.get('client')).toBeNull();
    expect(url.searchParams.get('profile')).toBeNull();
  });

  it('appends client/profile from window.amplitude when the flag is on', () => {
    (window as any).amplitude = {
      getDeviceId: () => 'device-abc',
      getSessionId: () => 1700000000000,
    };

    const url = new URL(
      initWidgetIframeUrl({
        ...baseConfig,
        useParentAmplitudeIdentity: true,
      })
    );
    expect(url.searchParams.get('client')).toBe('device-abc');
    expect(url.searchParams.get('profile')).toBe('1700000000000');
  });

  it('does not include the flag itself as a URL param', () => {
    (window as any).amplitude = {
      getDeviceId: () => 'device-abc',
      getSessionId: () => 1700000000000,
    };

    const url = new URL(
      initWidgetIframeUrl({
        ...baseConfig,
        useParentAmplitudeIdentity: true,
      })
    );
    expect(url.searchParams.get('useParentAmplitudeIdentity')).toBeNull();
  });

  it('skips silently when window.amplitude is missing', () => {
    delete (window as any).amplitude;

    const url = new URL(
      initWidgetIframeUrl({
        ...baseConfig,
        useParentAmplitudeIdentity: true,
      })
    );
    expect(url.searchParams.get('client')).toBeNull();
    expect(url.searchParams.get('profile')).toBeNull();
  });
});
