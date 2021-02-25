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
  WidgetVariantTypes,
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

export function countListenersForEvent(
  listeners: TEventListenerDict,
  event: TAllEventTypes,
  internal: boolean = false
): number {
  return listeners[event].filter((handler) => handler.internal === internal).length;
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
  variant: SyntheticWidgetVariants
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

  const { width, height } = containerNode.getBoundingClientRect();

  if (variant === 'embedded-desktop') {
    if (width < widgetDesktopWidth) {
      throw new Error(`Container node must be at least ${widgetDesktopWidth}px wide.`);
    }

    if (height < widgetDesktopHeight) {
      throw new Error(`Container node must be at least ${widgetDesktopHeight}px tall.`);
    }
  } else if (variant === 'embedded-mobile') {
    if (width < minWidgetMobileWidth) {
      throw new Error(`Container node must be at least ${minWidgetMobileWidth}px wide.`);
    }

    if (height < minWidgetMobileHeight) {
      throw new Error(`Container node must be at least ${minWidgetMobileHeight}px wide.`);
    }
  }
}
