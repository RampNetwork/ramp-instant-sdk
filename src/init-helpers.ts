import { baseWidgetUrl } from './consts';
import {
  AllWidgetVariants,
  IHostConfigWithWidgetInstanceId,
  InternalEventTypes,
  TAllEvents,
  WidgetVariantTypes,
} from './types';
import {
  minWidgetMobileHeight,
  minWidgetMobileWidth,
  widgetDesktopHeight,
  widgetDesktopWidth,
} from './utils';

export function initWidgetIframeUrl(config: IHostConfigWithWidgetInstanceId): string {
  const baseUrl = new URL(config.url || baseWidgetUrl);
  const hostUrl = window.location.origin;

  const { containerNode, url, ...configWithoutIframeUrl } = config;

  const preparedConfig = { ...configWithoutIframeUrl, hostUrl };

  Object.entries(preparedConfig).forEach(([key, value]) => {
    if (value) {
      baseUrl.searchParams.append(key, value);
    }
  });

  return baseUrl.toString();
}

export function hideWebsiteBelow(
  parent: Element | ShadowRoot,
  containerWidth?: number | undefined
): void {
  const backgroundWebsiteHider = document.createElement('div');
  backgroundWebsiteHider.classList.add('background-hider');

  if (containerWidth) {
    backgroundWebsiteHider.style.maxWidth = `${containerWidth}px`;
  }

  parent.appendChild(backgroundWebsiteHider);
}

export function initDOMNodeWithOverlay(
  url: string,
  dispatch: (event: TAllEvents) => void,
  config: IHostConfigWithWidgetInstanceId
): {
  body: HTMLBodyElement | null;
  iframe: HTMLIFrameElement;
  overlay: HTMLDivElement;
  shadow: ShadowRoot;
  shadowHost: HTMLDivElement;
} {
  const body = document.querySelector('body');

  const shadowHost = document.createElement('div');

  shadowHost.style.width = '100%';
  shadowHost.style.height = '100%';

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  shadow.appendChild(getStylesForShadowDom(config.variant));

  const iframe = prepareIframeNode(url, config.variant);
  const overlay = prepareOverlayNode(iframe, dispatch);

  overlay.appendChild(iframe);
  shadow.appendChild(overlay);

  return {
    body,
    iframe,
    overlay,
    shadow,
    shadowHost,
  };
}

export function initDOMNodeWithoutOverlay(
  url: string,
  _dispatch: (event: TAllEvents) => void,
  config: IHostConfigWithWidgetInstanceId
): {
  body: HTMLBodyElement | null;
  iframe: HTMLIFrameElement;
  overlay: null;
  shadow: ShadowRoot;
  shadowHost: HTMLDivElement;
} {
  const body = document.querySelector('body');

  const shadowHost = document.createElement('div');

  shadowHost.style.width = '100%';
  shadowHost.style.height = '100%';

  const shadow = shadowHost.attachShadow({ mode: 'open' });

  const container = document.createElement('div');
  container.classList.add('embedded-container');

  shadow.appendChild(container);

  const loader = document.createElement('div');
  loader.classList.add('loader-container');

  // tslint:disable:max-line-length
  loader.innerHTML = `
    <svg width="92" height="60" viewBox="0 0 51 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="loader">
      <path d="M16.2232 18.8309L22.282 24.912C22.7953 25.4272 22.7948 26.2647 22.281 26.7792L17.651 31.4158C16.8619 32.1947 15.5719 32.1947 14.7828 31.4158L0.591812 17.4093C-0.197271 16.6305 -0.197271 15.3571 0.591812 14.5783L14.7828 0.584122C15.5719 -0.194707 16.8619 -0.194707 17.651 0.584122L22.281 5.22078C22.7948 5.73535 22.7953 6.57281 22.282 7.08795L16.2232 13.1691C14.645 14.7267 14.645 17.2733 16.2232 18.8309Z" fill="#21BF73"></path>
      <path d="M34.4433 18.8309L28.3845 24.912C27.8712 25.4272 27.8717 26.2647 28.3855 26.7792L33.0155 31.4158C33.8046 32.1947 35.0946 32.1947 35.8837 31.4158L50.0747 17.4093C50.8638 16.6305 50.8638 15.3571 50.0747 14.5783L35.8837 0.584122C35.0946 -0.194707 33.8046 -0.194707 33.0155 0.584122L28.3855 5.22078C27.8717 5.73535 27.8712 6.57281 28.3845 7.08795L34.4433 13.1691C36.0215 14.7267 36.0215 17.2733 34.4433 18.8309Z" fill="#0A6E5C"></path>
      <path d="M17.8128 17.157C17.1737 16.518 17.1737 15.482 17.8128 14.843L24.1765 8.47926C24.8155 7.84025 25.8515 7.84025 26.4905 8.47926L32.8542 14.843C33.4932 15.482 33.4932 16.518 32.8542 17.157L26.4905 23.5207C25.8515 24.1598 24.8155 24.1598 24.1765 23.5207L17.8128 17.157Z" fill="#21BF73"></path>
    </svg>`;
  // tslint:enable:max-line-length

  container.appendChild(loader);

  shadow.appendChild(getStylesForShadowDom(config.variant));

  const iframe = prepareIframeNode(url, config.variant, config.containerNode);

  container.appendChild(iframe);

  return {
    body,
    iframe,
    overlay: null,
    shadow,
    shadowHost,
  };
}

export function importFonts(): void {
  if (document.querySelector('[data-ramp-font]')) {
    return;
  }

  const font = document.createElement('link');

  font.setAttribute(
    'href',
    'https://fonts.googleapis.com/css?family=Poppins:200,400,500,600,700&display=swap&subset=latin-ext'
  );
  font.setAttribute('rel', 'stylesheet');
  font.setAttribute('data-ramp-font', '');

  document.head.appendChild(font);
}

function prepareIframeNode(
  url: string,
  variant: AllWidgetVariants,
  containerNode?: HTMLElement
): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.setAttribute('src', url);

  if (containerNode) {
    iframe.setAttribute(
      'width',
      variant === 'desktop' || variant === 'embedded-desktop'
        ? widgetDesktopWidth.toString()
        : containerNode.getBoundingClientRect().width.toString()
    );

    iframe.setAttribute(
      'height',
      variant === 'desktop' || variant === 'embedded-desktop'
        ? widgetDesktopHeight.toString()
        : containerNode.getBoundingClientRect().height.toString()
    );
  } else {
    iframe.setAttribute(
      'width',
      variant === 'desktop' || variant === 'embedded-desktop'
        ? widgetDesktopWidth.toString()
        : window.innerWidth.toString()
    );

    iframe.setAttribute(
      'height',
      variant === 'desktop' || variant === 'embedded-desktop'
        ? widgetDesktopHeight.toString()
        : window.innerHeight.toString()
    );
  }

  iframe.classList.add('iframe');

  return iframe;
}

function prepareOverlayNode(
  iframe: HTMLIFrameElement,
  dispatch: (event: TAllEvents) => void
): HTMLDivElement {
  const overlay = document.createElement('div');

  overlay.classList.add('overlay');

  const loader = document.createElement('div');
  loader.classList.add('loader-container');

  // tslint:disable:max-line-length
  loader.innerHTML = `
    <svg width="92" height="60" viewBox="0 0 51 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="loader">
      <path d="M16.2232 18.8309L22.282 24.912C22.7953 25.4272 22.7948 26.2647 22.281 26.7792L17.651 31.4158C16.8619 32.1947 15.5719 32.1947 14.7828 31.4158L0.591812 17.4093C-0.197271 16.6305 -0.197271 15.3571 0.591812 14.5783L14.7828 0.584122C15.5719 -0.194707 16.8619 -0.194707 17.651 0.584122L22.281 5.22078C22.7948 5.73535 22.7953 6.57281 22.282 7.08795L16.2232 13.1691C14.645 14.7267 14.645 17.2733 16.2232 18.8309Z" fill="#21BF73"></path>
      <path d="M34.4433 18.8309L28.3845 24.912C27.8712 25.4272 27.8717 26.2647 28.3855 26.7792L33.0155 31.4158C33.8046 32.1947 35.0946 32.1947 35.8837 31.4158L50.0747 17.4093C50.8638 16.6305 50.8638 15.3571 50.0747 14.5783L35.8837 0.584122C35.0946 -0.194707 33.8046 -0.194707 33.0155 0.584122L28.3855 5.22078C27.8717 5.73535 27.8712 6.57281 28.3845 7.08795L34.4433 13.1691C36.0215 14.7267 36.0215 17.2733 34.4433 18.8309Z" fill="#0A6E5C"></path>
      <path d="M17.8128 17.157C17.1737 16.518 17.1737 15.482 17.8128 14.843L24.1765 8.47926C24.8155 7.84025 25.8515 7.84025 26.4905 8.47926L32.8542 14.843C33.4932 15.482 33.4932 16.518 32.8542 17.157L26.4905 23.5207C25.8515 24.1598 24.8155 24.1598 24.1765 23.5207L17.8128 17.157Z" fill="#21BF73"></path>
    </svg>`;
  // tslint:enable:max-line-length

  overlay.appendChild(loader);

  overlay.addEventListener('click', (event) => {
    if (event.target !== iframe && !overlay.querySelectorAll('.close-modal').length) {
      dispatch({
        type: InternalEventTypes.WIDGET_CLOSE_REQUEST,
        payload: null,
        internal: true,
      });
    }
  });

  return overlay;
}

export function safeCastToUrl(url: unknown) {
  try {
    return new URL(String(url));
  } catch {
    return;
  }
}

export function areValidUrls(urlStr0: string, urlStr1: string): boolean {
  const url0 = safeCastToUrl(urlStr0);
  const url1 = safeCastToUrl(urlStr1);

  if (!url0 || !url1) {
    return false;
  }

  const hasSameScheme = url0.origin === url1.origin;
  const hasSameDomain = url0.hostname === url1.hostname;
  const hasTruthyDomain = Boolean(url0.hostname) && Boolean(url1.hostname);

  return hasSameScheme && hasSameDomain && hasTruthyDomain;
}

export function isCloseModalAlreadyOpen(containerNode: HTMLElement): boolean {
  return containerNode.querySelectorAll('.close-modal').length !== 0;
}

export function prepareCloseModalNode(dispatch: (event: TAllEvents) => void): HTMLDivElement {
  const container = document.createElement('div');
  container.classList.add('close-modal');

  const textEl = document.createElement('div');
  textEl.classList.add('close-modal__text');
  textEl.textContent = 'Are you sure you want to exit Ramp Instant and abandon the transaction?';

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('close-modal__button-container');

  const cancelButton = document.createElement('button');
  cancelButton.setAttribute('type', 'button');
  cancelButton.classList.add('close-modal__button');
  cancelButton.classList.add('close-modal__button--cancel');
  cancelButton.textContent = 'Cancel';
  cancelButton.addEventListener('click', (event) => {
    event.stopPropagation();

    dispatch({
      type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CANCELLED,
      payload: null,
      internal: true,
    });
  });

  const exitButton = document.createElement('button');
  exitButton.setAttribute('type', 'button');
  exitButton.classList.add('close-modal__button');
  exitButton.classList.add('close-modal__button--exit');
  exitButton.textContent = 'Exit';
  exitButton.addEventListener('click', (event) => {
    event.stopPropagation();

    dispatch({
      type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CONFIRMED,
      payload: null,
      internal: true,
    });
  });

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(exitButton);

  container.appendChild(textEl);
  container.appendChild(buttonContainer);

  return container;
}

function getStylesForShadowDom(variant: AllWidgetVariants): HTMLStyleElement {
  const styles = document.createElement('style');

  const isMobile =
    variant === 'mobile' || variant === 'hosted-mobile' || variant === 'embedded-mobile';
  const isEmbedded = variant === 'embedded-mobile' || variant === 'embedded-desktop';

  styles.textContent = `

    .background-hider {
      content: '';
      height: 30vh;
      width: 100vw;
      position: fixed;
      bottom: 0;
      transform: translateY(50%);
      background-color: #f5f8fb;
      z-index: 999;
    }

    .overlay {
      position: fixed;
      z-index: 1000;
      width: 100vw;
      height: ${isMobile ? '100%;' : '100vh;'}
      top: 0;
      left: 0;
      overflow: hidden;
      background-color: rgba(166, 174, 185, 0.7);
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      ${isMobile ? 'align-items: flex-start;' : 'align-items: center;'}
    }

    .embedded-container {
      z-index: 1000;
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      ${isMobile ? 'align-items: flex-start;' : 'align-items: center;'}
      min-width: ${isMobile ? minWidgetMobileWidth : widgetDesktopWidth}px;
      min-height: ${isMobile ? minWidgetMobileHeight : widgetDesktopHeight}px;
    }

    .loader-container {
      align-self: center;
    }

    .loader {
      transform-origin: center;
      animation: logoAnimation 4s linear infinite;
      width: 100px;
      height: auto;
      align-self: center;
    }

    .loader path:nth-child(3) {
      transform-origin: center;
      position: relative;
    }

    .loader path:nth-child(1) {
      transform-origin: center;
      position: relative;
      animation: box1Animation 4s linear infinite;
      transform: scale(0.4) translateX(6px);
    }

    .loader path:nth-child(2) {
      transform-origin: center;
      position: relative;
      animation: box4Animation 4s linear infinite;
      transform: scale(0.4) translateX(-6px);
    }

    @keyframes logoAnimation {
      10% {
        transform: rotate(180deg);
      }
      30%{
        transform: rotate(360deg);
      }
      70% {
        transform: rotate(360deg);
      }
      90% {
        transform: rotate(520deg);
      }
      100% {
        transform: rotate(720deg);
      }
    }

    @keyframes box1Animation {
      0%, 10% {
        transform: scale(0.4) translateX(6px);
      }
      30%, 70% {
        transform: scale(1) translateX(0);
      }
      90% {
        transform: scale(0.4) translateX(6px);
      }
    }


    @keyframes box4Animation {
      0%, 10% {
        transform: scale(0.4) translateX(-6px);
      }
      30%, 70% {
        transform: scale(1) translateX(0);
      }
      90% {
        transform: scale(0.4) translateX(-6px);
      }
    }

    .iframe {
      border: none;
      user-select: none;
      visibility: hidden;
      position: absolute;
    }

    .iframe.visible {
      visibility: visible;
      ${
        !isEmbedded && isMobile
          ? `
        width: 100vw;
        height: 100%;
      `
          : ''
      }
    }

    .close-modal {
      font-family: 'Poppins', sans-serif;
      width: 678px;
      height: 276px;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      box-shadow: 0px 54px 200px rgba(36, 37, 57, 0.2);
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;
      padding: 35px;
      border-radius: 8px;
      background: #fff;

      box-sizing: border-box;
    }

    .close-modal * {
      box-sizing: border-box;
    }

    .close-modal__text {
      margin: 40px auto 30px;
      font-weight: 600;
      font-size: 24px;
      line-height: 36px;
      text-align: center;

      color: #242539;
    }

    .close-modal__button-container {
      width: 318px;
      display: flex;
      flex-flow: row nowrap;
      justify-content: space-between;
      align-items: center;
    }

    .close-modal__button {
      background: #fff;
      border: 2px solid #EDEEF3;
      border-radius: 74px;
      width: 152px;
      height: 56px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      line-height: 21px;
      color: #2B2D56;
      text-transform: uppercase;
    }

    .close-modal__button--exit {
      background: #DD3E56;
      box-shadow: 0px 8px 34px rgba(221, 62, 86, 0.4);
      color: #fff;
      border-color: transparent;
    }
  `;

  return styles;
}
