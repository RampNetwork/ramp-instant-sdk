import {
  AllWidgetVariants,
  EventSeverity,
  IConfigError,
  IHostConfig,
  InternalEventTypes,
  SyntheticWidgetVariants,
  TAllEventTypes,
  TEventListenerDict,
  WidgetEventTypes,
} from './types';

export function getRandomIntString(): string {
  try {
    return String(crypto.getRandomValues(new Uint32Array(1))[0]);
  } catch {
    // if `crypto` is not supported, fall back to Math.random
    // tslint:disable-next-line:no-magic-numbers
    return String(Math.floor(Math.random() * 10000000));
  }
}

export const widgetDesktopWidth = 895;
export const widgetDesktopHeight = 590;

export const minWidgetMobileWidth = 320;
export const minWidgetMobileHeight = 667;

export function normalizeConfigAndLogErrorsOnInvalidFields(
  config: Partial<IHostConfig>
): IHostConfig {
  const errors: IConfigError[] = [];
  const configCopy = { ...config };

  if (
    ![
      'desktop',
      'mobile',
      'hosted-desktop',
      'hosted-mobile',
      'hosted-auto',
      'auto',
      'embedded-desktop',
      'embedded-mobile',
    ].includes(config.variant!)
  ) {
    configCopy.variant = 'desktop';

    errors.push({
      fieldName: 'variant',
      description: 'Invalid value for `variant` config field ',
      exampleValue: `'desktop'`,
      severity: EventSeverity.WARNING,
    });
  }

  if (config.variant === 'embedded-desktop' || config.variant === 'embedded-mobile') {
    validateContainerNode(config.containerNode, config.variant);
  }

  if (!['embedded-desktop', 'embedded-mobile'].includes(configCopy.variant!)) {
    delete configCopy.containerNode;
  }

  if (typeof config.useSendCryptoCallback !== 'undefined') {
    delete config.useSendCryptoCallback;
  }

  logErrors(errors);

  return configCopy as IHostConfig;
}

function logErrors(errors: IConfigError[]): void {
  if (!errors.length) {
    return;
  }

  // tslint:disable:no-console
  console.group('Config errors');

  errors.forEach((error) => {
    console.group(error.fieldName);

    console.log(error.description);
    console.log(`Example expected value: ${error.exampleValue}`);
    console.log(`Severity: ${error.severity}`);

    console.groupEnd();
  });

  console.groupEnd();
  // tslint:enable:no-console
}

export function initEventListenersDict(): TEventListenerDict {
  const widgetEventTypes = Array.from(Object.values(WidgetEventTypes));
  const internalEventTypes = Array.from(Object.values(InternalEventTypes));

  return [...widgetEventTypes, ...internalEventTypes].reduce<TEventListenerDict>(
    (listenersDict: TEventListenerDict, eventType: TAllEventTypes) => {
      listenersDict[eventType] = [];

      return listenersDict;
    },
    {} as any
  ) as TEventListenerDict;
}

export function determineWidgetVariant(config: IHostConfig): AllWidgetVariants {
  const mediaQuery = '(min-width: 920px) and (min-height: 630px)';
  const variant = config.variant?.toLocaleLowerCase();

  if (
    variant === 'mobile' ||
    variant === 'desktop' ||
    variant === 'hosted-mobile' ||
    variant === 'hosted-desktop' ||
    variant === 'embedded-desktop' ||
    variant === 'embedded-mobile'
  ) {
    return variant;
  }

  const isDesktop = window.matchMedia(mediaQuery).matches;

  if (variant === 'hosted-auto') {
    return isDesktop ? 'hosted-desktop' : 'hosted-mobile';
  }

  return isDesktop ? 'desktop' : 'mobile';
}

export function isHtmlElement(element: Element): element is HTMLElement {
  return typeof (element as any).blur === 'function';
}

function validateContainerNode(
  containerNode: HTMLElement | undefined,
  _variant: SyntheticWidgetVariants
): void {
  if (!document.body) {
    throw new Error("Couldn't find <body> element.");
  }

  if (!(containerNode instanceof HTMLElement)) {
    throw new Error('Container node has to be a proper HTML element.');
  }

  if (!document.body.contains(containerNode)) {
    throw new Error('Container node must be attached to the document.');
  }
}

/**
 * Concatenates `base` with `path`, always treating `path` as a relative path. Ignores:
 *   - trailing slash in `base`
 *   - leading slash in `path`
 * @param base base URL, e.g.: 'http://example.com/api' or 'http://example.com/service/api/'
 * @param path path to append, e.g.: 'user/getByEmail' or '/swap'
 */
export function concatRelativePath(base: string | URL, path: string): URL {
  const normalizedBase = urlWithoutTrailingSlash(base instanceof URL ? base.href : base);
  const normalizedPath = path.startsWith('/') ? path.substr(1) : path;
  return new URL(`${normalizedBase}/${normalizedPath}`);
}

export function urlWithoutTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
