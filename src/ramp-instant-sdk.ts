import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import { baseWidgetUrl } from './consts';
import { hideWebsiteBelow } from './init-helpers';

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
  IHostConfigWithWidgetInstanceId,
  InternalEventTypes,
  TAllEvents,
  TAllEventTypes,
  TEventListenerDict,
  TWidgetEvents,
  WidgetEventTypes,
} from './types';

import {
  determineWidgetVariant,
  getRandomIntString,
  initEventListenersDict,
  isHtmlElement,
  normalizeConfigAndLogErrorsOnInvalidFields,
} from './utils';

export {
  IWidgetCloseEvent as WidgetCloseEvent,
  IWidgetCloseRequestCancelledEvent as WidgetCloseRequestCancelledEvent,
  IWidgetCloseRequestConfirmedEvent as WidgetCloseRequestConfirmedEvent,
  IWidgetCloseRequestEvent as WidgetCloseRequestEvent,
  IWidgetConfigDoneEvent as WidgetConfigDoneEvent,
  IWidgetEvent as RampInstantEvent,
  TWidgetEvents as RampInstantEvents,
  WidgetEventTypes as RampInstantEventTypes,
  AllWidgetVariants as RampInstantWidgetVariantTypes,
  IPurchase as RampInstantPurchase,
} from './types';

export class RampInstantSDK {
  public widgetWindow?: Window;
  public domNodes?: {
    body: HTMLBodyElement | null;
    iframe: HTMLIFrameElement;
    overlay: HTMLDivElement | null;
    shadowHost: HTMLDivElement;
    shadow: ShadowRoot;
  };

  private _config: IHostConfigWithWidgetInstanceId;
  private _rawNormalizedConfig: IHostConfig;
  private _listeners: TEventListenerDict = initEventListenersDict();
  private _isVisible: boolean = false;

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

    this._rawNormalizedConfig = normalizeConfigAndLogErrorsOnInvalidFields({
      variant: 'desktop',
      ...config,
    });

    const widgetVariant = determineWidgetVariant(this._rawNormalizedConfig);

    this._config = {
      ...this._rawNormalizedConfig,
      variant: widgetVariant,
      widgetInstanceId: getRandomIntString(),
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
      this._listeners[type] = this._listeners[type].filter((l) => l.callback !== callback);
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
      this._listeners[type].push({ callback, internal });
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

  private _subscribeToWidgetEvents(event: MessageEvent): void {
    if (!event.data) {
      return;
    }

    if (!areUrlsEqual(event.origin, this._config.url || baseWidgetUrl)) {
      return;
    }

    const eventData = event.data as TWidgetEvents;

    if (
      !eventData.widgetInstanceId ||
      eventData.widgetInstanceId !== this._config.widgetInstanceId
    ) {
      return;
    }

    this._dispatchEvent(eventData);
  }

  private _registerSdkEventHandlers(): void {
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

    const onConfigEvent = () => {
      if (this._isConfiguredAsHosted()) {
        return;
      }

      this.domNodes?.iframe.classList.add('visible');

      const loader = this.domNodes?.shadow.querySelector('.loader-container');

      if (loader) {
        loader.remove();
      }
    };

    this._on(WidgetEventTypes.WIDGET_CONFIG_DONE, onConfigEvent, true);
    this._on(WidgetEventTypes.WIDGET_CONFIG_FAILED, onConfigEvent, true);

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

  private _dispatchEvent(event: TAllEvents): void {
    const { type } = event;

    this._listeners[type].forEach((handler) => handler.callback(event));
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

  // Event subscriptions aren't cleared so that host can receive a PAYMENT_SUCCESSFUL event
  // even after the widget has been closed
  private _teardownEventSubscriptions(): void {
    window.removeEventListener('keydown', this._handleEscapeClick, true);
    window.removeEventListener('message', this._subscribeToWidgetEvents);
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

    disableBodyScroll(this.domNodes.iframe);

    const widgetMode = determineWidgetVariant(this._config);

    if (widgetMode !== 'desktop' && widgetMode !== 'embedded-desktop') {
      hideWebsiteBelow(this.domNodes.shadow);
    }
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
}
