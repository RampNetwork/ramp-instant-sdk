import { clearAllBodyScrollLocks, disableBodyScroll } from './body-scroll-lock';
import { getBaseUrl, makeIframeResponsive } from './init-helpers';
import { SDK_VERSION, SEND_CRYPTO_SUPPORTED_VERSION } from './consts';

import {
  areUrlsEqual,
  importFonts,
  initDOMNodeWithoutOverlay,
  initDOMNodeWithOverlay,
  initWidgetIframeUrl,
  isCloseModalAlreadyOpen,
  prepareCloseModalNode,
} from './init-helpers';

import {
  IHostConfig,
  IHostConfigWithSdkParams,
  InternalEventTypes,
  InternalSdkEventTypes,
  IRequestCryptoAccountEvent,
  TAllEvents,
  TAllEventTypes,
  TEventListenerDict,
  TOnRequestCryptoAccountCallback,
  IOnRequestCryptoAccountResult,
  TSdkEvents,
  TWidgetEvents,
  WidgetEventTypes,
  TOnSendCryptoCallback,
  ISendCryptoEvent,
  IOnSendCryptoResult,
  IAppVersionEvent,
} from './types';

import {
  determineWidgetVariant,
  getRandomIntString,
  initEventListenersDict,
  isHtmlElement,
  normalizeConfigAndLogErrorsOnInvalidFields,
} from './utils';

export {
  type IWidgetCloseEvent as WidgetCloseEvent,
  type IWidgetCloseRequestCancelledEvent as WidgetCloseRequestCancelledEvent,
  type IWidgetCloseRequestConfirmedEvent as WidgetCloseRequestConfirmedEvent,
  type IWidgetCloseRequestEvent as WidgetCloseRequestEvent,
  type IWidgetConfigDoneEvent as WidgetConfigDoneEvent,
  type IWidgetEvent as RampInstantEvent,
  type TWidgetEvents as RampInstantEvents,
  WidgetEventTypes as RampInstantEventTypes,
  type AllWidgetVariants as RampInstantWidgetVariantTypes,
  type IPurchase as RampInstantPurchase,
} from './types';

export class RampInstantSDK {
  public widgetWindow?: Window;
  public domNodes?: {
    body: HTMLBodyElement | null;
    iframe: HTMLIFrameElement;
    overlay: HTMLDivElement | null;
    shadowHost: HTMLDivElement;
    shadow: ShadowRoot;
    container?: HTMLDivElement;
  };

  private _config: IHostConfigWithSdkParams;
  private _rawNormalizedConfig: IHostConfig;
  private _listeners: TEventListenerDict = initEventListenersDict();
  private _isVisible: boolean = false;
  private _onSendCryptoCallback: TOnSendCryptoCallback | undefined = undefined;

  constructor(config: IHostConfig) {
    importFonts();

    this.unsubscribe = this.unsubscribe.bind(this);
    this.on = this.on.bind(this);
    this.show = this.show.bind(this);
    this._handleEscapeClick = this._handleEscapeClick.bind(this);
    this._dispatchEvent = this._dispatchEvent.bind(this);
    this._subscribeToWidgetEvents = this._subscribeToWidgetEvents.bind(this);
    this._on = this._on.bind(this);
    this._registerSdkEventHandlers = this._registerSdkEventHandlers.bind(this);
    this._subscribeToWidgetEvents = this._subscribeToWidgetEvents.bind(this);
    this._onSendCrypto = this._onSendCrypto.bind(this);

    this._rawNormalizedConfig = normalizeConfigAndLogErrorsOnInvalidFields({
      variant: 'desktop',
      ...config,
    });

    this._config = {
      ...this._rawNormalizedConfig,
      ...this._getHostConfigSdkParams(this._rawNormalizedConfig, config.useSendCryptoCallback),
    };
  }

  public show(): RampInstantSDK {
    if (this._isVisible) {
      throw new Error('Widget is already visible - you can only call this once per instance');
    }

    if (document.activeElement && isHtmlElement(document.activeElement)) {
      document.activeElement.blur();
    }

    this._registerSdkEventHandlers();

    window.addEventListener('message', this._subscribeToWidgetEvents);

    if (this._isConfiguredAsHosted()) {
      this._showUsingHostedMode();
    } else if (this._isConfiguredAsEmbedded()) {
      this._showUsingEmbeddedMode();
    } else if (this._isConfiguredWithOverlay()) {
      this._showUsingOverlayMode();
    }

    window.addEventListener('keydown', this._handleEscapeClick, true);

    return this;
  }

  public on<T extends TAllEvents>(
    type: T['type'] | '*',
    callback: (event: T) => any
  ): RampInstantSDK {
    this._on(type, callback, false);

    return this;
  }

  public unsubscribe(
    type: TAllEvents['type'] | '*',
    callback: (event: TAllEvents) => any
  ): RampInstantSDK {
    if (type === '*') {
      const allTypes = Object.entries(this._listeners);

      allTypes.forEach(([key, eventHandlers]) => {
        const filteredHandlers = eventHandlers.filter((l) => l.callback !== callback);
        this._listeners[key as TAllEventTypes] = filteredHandlers;
      });
    } else {
      this._listeners[type] = this._listeners[type]?.filter((l) => l.callback !== callback);
    }

    return this;
  }

  public _on<T extends TAllEvents>(
    type: T['type'] | '*',
    callback: (event: T) => any,
    internal: boolean
  ): void {
    if (type !== '*' && !this._listeners[type]) {
      // tslint:disable-next-line:no-console
      console.warn(
        `Unknown / unsupported event name - '${type}'. This listener will have no effect.`
      );
    }

    if (type === '*') {
      const allTypes = Object.values(this._listeners);
      allTypes.forEach((eventHandlers) => eventHandlers.push({ callback, internal }));
    } else {
      this._listeners[type]?.push({ callback, internal });
    }
  }

  public close(): RampInstantSDK {
    this._dispatchEvent({
      type: WidgetEventTypes.WIDGET_CLOSE,
      payload: null,
      widgetInstanceId: this._config.widgetInstanceId,
    });

    return this;
  }

  public onSendCrypto(callback: TOnSendCryptoCallback): RampInstantSDK {
    this._onSendCryptoCallback = callback;
    return this;
  }

  public onRequestCryptoAccount(callback: TOnRequestCryptoAccountCallback): RampInstantSDK {
    const onRequestCryptoAccount = async (event: IRequestCryptoAccountEvent) => {
      let result: IOnRequestCryptoAccountResult;
      try {
        result = await callback(event.payload.type, event.payload.assetSymbol);
        if (!result.address) {
          throw new Error('Missing address in the callback result');
        }
      } catch (e) {
        let errorMessage: string | undefined;
        if (typeof e === 'string') {
          errorMessage = e;
        } else if (e instanceof Error) {
          errorMessage = e.message;
        }
        this._sendEventToWidget({
          type: InternalSdkEventTypes.REQUEST_CRYPTO_ACCOUNT_RESULT,
          payload: {
            error: errorMessage,
          },
        });
        return;
      }

      this._sendEventToWidget({
        type: InternalSdkEventTypes.REQUEST_CRYPTO_ACCOUNT_RESULT,
        payload: {
          address: result.address,
          type: result.type,
          name: result.name,
          assetSymbol: result.assetSymbol,
        },
      });
    };

    this._on(InternalEventTypes.REQUEST_CRYPTO_ACCOUNT, onRequestCryptoAccount, true);

    return this;
  }

  private _subscribeToWidgetEvents(event: MessageEvent): void {
    if (!event.data) {
      return;
    }

    if (!areUrlsEqual(event.origin, getBaseUrl(this._config).origin)) {
      return;
    }

    const eventData = event.data as TWidgetEvents;

    if (
      !eventData.widgetInstanceId ||
      eventData.widgetInstanceId !== this._config.widgetInstanceId
    ) {
      return;
    }

    if (
      ![...Object.values(WidgetEventTypes), ...Object.values(InternalEventTypes)].includes(
        eventData.type
      )
    ) {
      return;
    }

    this._dispatchEvent(eventData);
  }

  private _registerSdkEventHandlers(): void {
    this._on(
      InternalEventTypes.APP_VERSION,
      (event: IAppVersionEvent) => {
        const [major] = event.payload.version.split('.') ?? [];
        const parsedMajor = Number(major);

        if (parsedMajor >= 2 && this.domNodes?.iframe) {
          makeIframeResponsive(
            this.domNodes.iframe,
            this.domNodes.container,
            this._config.containerNode
          );
          this._makeVisible();
          this._removeEscapeHandler();
        }
      },
      true
    );

    this._on(
      WidgetEventTypes.WIDGET_CLOSE,
      (_event) => {
        if (this._isConfiguredAsHosted()) {
          try {
            this.widgetWindow?.close();
          } catch (e) {
            throw new Error('Could not close the widget window');
          }
        } else {
          this.domNodes?.shadowHost.remove();
          clearAllBodyScrollLocks();
        }

        this._teardownEventSubscriptions();
      },
      true
    );

    if (this._config.useSendCryptoCallbackVersion) {
      this.on(InternalEventTypes.SEND_CRYPTO, this._onSendCrypto);
    }

    this._on(WidgetEventTypes.WIDGET_CONFIG_DONE, () => this._onConfigEvent(), true);
    this._on(WidgetEventTypes.WIDGET_CONFIG_FAILED, () => this._onConfigEvent(), true);

    this._on(
      InternalEventTypes.WIDGET_CLOSE_REQUEST,
      (_event) => {
        if (this._isConfiguredAsHosted() || this._isConfiguredAsEmbedded()) {
          return;
        }

        if (this._config.variant === 'mobile' || isCloseModalAlreadyOpen(this.domNodes!.overlay!)) {
          return;
        }

        this.domNodes!.overlay!.appendChild(prepareCloseModalNode(this._dispatchEvent));
      },
      true
    );

    this._on(
      InternalEventTypes.WIDGET_CLOSE_REQUEST_CONFIRMED,
      (_event) => {
        this._dispatchEvent({
          type: WidgetEventTypes.WIDGET_CLOSE,
          payload: null,
          widgetInstanceId: this._config.widgetInstanceId,
        });
      },
      true
    );

    this._on(
      InternalEventTypes.WIDGET_CLOSE_REQUEST_CANCELLED,
      (_event) => {
        if (this._isConfiguredAsHosted() || this._isConfiguredAsEmbedded()) {
          return;
        }

        const modal = this.domNodes!.overlay!.querySelector('.close-modal');

        if (modal) {
          modal.remove();
        }
      },
      true
    );
  }

  private _sendEventToWidget(event: TSdkEvents): void {
    if (!this._isVisible) {
      throw new Error(`Widget is not visible couldn't send the event`);
    }
    try {
      (this.widgetWindow ?? this.domNodes?.iframe.contentWindow)?.postMessage(
        event,
        getBaseUrl(this._config).origin
      );
      // tslint:disable-next-line:no-empty
    } catch {}
  }

  private _dispatchEvent(event: TAllEvents): void {
    const { type } = event;

    this._listeners[type]?.forEach((handler) => handler.callback(event));
  }

  private _handleEscapeClick(event: KeyboardEvent): void {
    const escKeyCode = 27;

    if (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === escKeyCode) {
      this._dispatchEvent({
        type: InternalEventTypes.WIDGET_CLOSE_REQUEST,
        payload: null,
        internal: true,
      });
    }
  }

  private async _onSendCrypto(event: ISendCryptoEvent): Promise<void> {
    let result: IOnSendCryptoResult | undefined;
    if (event.eventVersion !== SEND_CRYPTO_SUPPORTED_VERSION) {
      // tslint:disable-next-line:no-console
      console.warn(`unsupported event version - '${event}'. This listener will have no effect.`);
      return;
    }
    try {
      result = await this._onSendCryptoCallback?.(
        event.payload.assetInfo,
        event.payload.amount,
        event.payload.address
      );
      if (!result?.txHash) {
        throw new Error('Missing txHash in the callback result');
      }
    } catch (e) {
      let errorMessage: string | undefined;
      if (typeof e === 'string') {
        errorMessage = e;
      } else if (e instanceof Error) {
        errorMessage = e.message;
      }
      this._sendEventToWidget({
        eventVersion: SEND_CRYPTO_SUPPORTED_VERSION,
        type: InternalSdkEventTypes.SEND_CRYPTO_RESULT,
        payload: {
          error: errorMessage,
        },
      });
      return;
    }

    this._sendEventToWidget({
      eventVersion: SEND_CRYPTO_SUPPORTED_VERSION,
      type: InternalSdkEventTypes.SEND_CRYPTO_RESULT,
      payload: {
        txHash: result.txHash,
      },
    });
  }

  // Event subscriptions aren't cleared so that host can receive a PAYMENT_SUCCESSFUL event
  // even after the widget has been closed
  private _teardownEventSubscriptions(): void {
    this._removeEscapeHandler();
    window.removeEventListener('message', this._subscribeToWidgetEvents);
  }

  private _removeEscapeHandler(): void {
    window.removeEventListener('keydown', this._handleEscapeClick, true);
  }

  private _showUsingEmbeddedMode(): void {
    const widgetUrl = initWidgetIframeUrl(this._config);

    this.domNodes = initDOMNodeWithoutOverlay(widgetUrl, this._dispatchEvent, this._config);

    if (!this.domNodes?.body) {
      throw new Error("Couldn't find <body> element.");
    }

    this._config.containerNode?.appendChild(this.domNodes.shadowHost);

    this._isVisible = true;
  }

  private _showUsingOverlayMode(): void {
    const widgetUrl = initWidgetIframeUrl(this._config);

    this.domNodes = initDOMNodeWithOverlay(widgetUrl, this._dispatchEvent, this._config);

    if (!this.domNodes?.body) {
      throw new Error("Couldn't find <body> element.");
    }

    this.domNodes.body.appendChild(this.domNodes.shadowHost);

    this._isVisible = true;

    disableBodyScroll();
  }

  private _showUsingHostedMode(): void {
    const widgetUrl = initWidgetIframeUrl(this._config);

    this.widgetWindow = window.open(widgetUrl) ?? undefined;
  }

  private _isConfiguredWithOverlay(): boolean {
    return ['desktop', 'mobile'].includes(this._config.variant);
  }

  private _isConfiguredAsHosted(): boolean {
    return ['hosted-desktop', 'hosted-mobile'].includes(this._config.variant);
  }

  private _isConfiguredAsEmbedded(): boolean {
    return ['embedded-desktop', 'embedded-mobile'].includes(this._rawNormalizedConfig.variant!);
  }

  private _getHostConfigSdkParams(
    config: IHostConfig,
    useSendCryptoCallback?: boolean
  ): Pick<
    IHostConfigWithSdkParams,
    | 'sdkType'
    | 'sdkVersion'
    | 'variant'
    | 'widgetInstanceId'
    | 'useSendCryptoCallbackVersion'
    | 'closeable'
  > {
    const widgetVariant = determineWidgetVariant(config);
    const closeable = config.closeable ?? ['desktop', 'mobile'].includes(widgetVariant);

    return {
      sdkType: 'WEB',
      sdkVersion: SDK_VERSION,
      variant: widgetVariant,
      widgetInstanceId: getRandomIntString(),
      closeable,
      ...(useSendCryptoCallback
        ? { useSendCryptoCallbackVersion: SEND_CRYPTO_SUPPORTED_VERSION }
        : {}),
    };
  }

  private _makeVisible() {
    if (this._isConfiguredAsHosted()) {
      return;
    }

    this.domNodes?.iframe.classList.add('visible');

    const loader = this.domNodes?.shadow.querySelector('.loader-container');

    if (loader) {
      loader.remove();
    }
  }

  private _onConfigEvent() {
    this._makeVisible();
  }
}
