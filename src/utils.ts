import {
  EventSeverity,
  IConfigError,
  IHostConfig,
  InternalEventTypes,
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

export function normalizeConfigAndLogErrorsOnInvalidFields(
  config: Partial<IHostConfig>
): IHostConfig {
  const errors: IConfigError[] = [];
  const configCopy = { ...config };

  if (
    !['desktop', 'mobile', 'hosted-desktop', 'hosted-mobile', 'hosted-auto', 'auto'].includes(
      config.variant!
    )
  ) {
    configCopy.variant = 'desktop';

    errors.push({
      fieldName: 'variant',
      description: 'Invalid value for `variant` config field ',
      exampleValue: `'desktop'`,
      severity: EventSeverity.WARNING,
    });
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

export function determineWidgetVariant(config: IHostConfig): WidgetVariantTypes {
  const mediaQuery = '(min-width: 920px) and (min-height: 630px)';
  const variant = config.variant?.toLocaleLowerCase();

  if (
    variant === 'mobile' ||
    variant === 'desktop' ||
    variant === 'hosted-mobile' ||
    variant === 'hosted-desktop'
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
