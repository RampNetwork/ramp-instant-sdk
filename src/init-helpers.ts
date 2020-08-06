import { baseWidgetUrl } from './consts';
import {
  IHostConfigWithWidgetInstanceId,
  InternalEventTypes,
  TAllEvents,
  WidgetVariantTypes
} from './types';

export function initWidgetIframeUrl(config: IHostConfigWithWidgetInstanceId): string {
  const baseUrl = new URL(config.url || baseWidgetUrl);
  const hostUrl = window.location.origin;

  const { url, ...configWithoutIframeUrl } = config;

  const preparedConfig = { ...configWithoutIframeUrl, hostUrl };

  Object.entries(preparedConfig).forEach(([key, value]) => {
    if (value) {
      baseUrl.searchParams.append(key, value);
    }
  });

  return baseUrl.toString();
}

export function initDOMNode(
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
    shadowHost
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

function prepareIframeNode(url: string, variant: WidgetVariantTypes): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.setAttribute('src', url);

  iframe.setAttribute('width', variant === 'desktop' ? '895' : window.innerWidth.toString());

  iframe.setAttribute('height', variant === 'desktop' ? '590' : window.innerHeight.toString());

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

  // tslint:disable-next-line:max-line-length
  loader.innerHTML = `<svg width="92" height="60" viewBox="0 0 46 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="loader"><path d="M15.0061 17.654L21.5635 24.2138L16.3269 29.4524C15.597 30.1825 14.4037 30.1825 13.6738 29.4524L0.547415 16.3212C-0.182472 15.5911 -0.182472 14.3973 0.547415 13.6672L13.6738 0.547614C14.4037 -0.182538 15.597 -0.182538 16.3269 0.547614L21.5635 5.78617L15.0061 12.346C13.5463 13.8063 13.5463 16.1937 15.0061 17.654Z" fill="#56BE89"></path><path d="M45.4243 16.3212L32.2979 29.4524C31.568 30.1825 30.3747 30.1825 29.6448 29.4524L24.4082 24.2138L30.9656 17.654C32.4254 16.1937 32.4254 13.8178 30.9656 12.346L24.4082 5.78617L29.6448 0.547614C30.3747 -0.182538 31.568 -0.182538 32.2979 0.547614L45.4243 13.6788C46.1542 14.4089 46.1542 15.5911 45.4243 16.3212Z" fill="#31335D"></path><path d="M29.4532 16.321L22.8958 22.8808L16.3384 16.321C15.6085 15.5909 15.6085 14.3971 16.3384 13.667L22.8958 7.10718L29.4532 13.667C30.1831 14.4087 30.1831 15.5909 29.4532 16.321Z" fill="#56BE89"></path></svg>`;

  overlay.appendChild(loader);

  overlay.addEventListener('click', event => {
    if (event.target !== iframe && !overlay.querySelectorAll('.close-modal').length) {
      dispatch({
        type: InternalEventTypes.WIDGET_CLOSE_REQUEST,
        payload: null,
        internal: true
      });
    }
  });

  return overlay;
}

export function areUrlsEqual(url0: string, url1: string): boolean {
  return new URL(url0).toString() === new URL(url1).toString();
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
  cancelButton.addEventListener('click', event => {
    event.stopPropagation();

    dispatch({
      type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CANCELLED,
      payload: null,
      internal: true
    });
  });

  const exitButton = document.createElement('button');
  exitButton.setAttribute('type', 'button');
  exitButton.classList.add('close-modal__button');
  exitButton.classList.add('close-modal__button--exit');
  exitButton.textContent = 'Exit';
  exitButton.addEventListener('click', event => {
    event.stopPropagation();

    dispatch({
      type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CONFIRMED,
      payload: null,
      internal: true
    });
  });

  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(exitButton);

  container.appendChild(textEl);
  container.appendChild(buttonContainer);

  return container;
}

function getStylesForShadowDom(variant: WidgetVariantTypes): HTMLStyleElement {
  const styles = document.createElement('style');

  const isMobile = variant === 'mobile';

  styles.textContent = `
    .overlay {
      position: fixed;
      z-index: 1000;
      width: 100vw;
      height: 100vh;
      top: 0;
      left: 0;
      background-color: rgba(166, 174, 185, 0.7);
      display: flex;
      flex-flow: row nowrap;
      justify-content: center;
      ${isMobile ? 'align-items: flex-start;' : 'align-items: center;'}
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
      position: unset;
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
