import { getBaseUrl, initWidgetIframeUrl, areUrlsEqual } from '../src/init-helpers';

describe('helpers tests', () => {
  it('getBaseUrl should return URL', () => {
    const testUrl = 'http://example.com';
    //@ts-ignore
    const url = getBaseUrl({ url: testUrl });
    expect(url).toBeInstanceOf(URL);
    //@ts-ignore
    expect(getBaseUrl()).toBeInstanceOf(URL);
  });

  it('initWidgetIframeUrl should return widget iframe url', () => {
    //@ts-ignore
    expect(initWidgetIframeUrl({})).toBeTruthy();
  });

  it('areUrlsEqual should return boolean', () => {
    expect(areUrlsEqual).not.toThrowError();
    expect(areUrlsEqual('a', 'b')).toBeFalsy();
    const url = 'http://example.com';
    expect(areUrlsEqual(url, url)).toBeTruthy();
  });
});
