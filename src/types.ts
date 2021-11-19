type TAsset = string;
type TEthAddress = string;
type TSwapAmount = string;
type THostLogoUrl = string;
type THostApiKey = string;
type THostAppName = string;
type TURL = string;
type TDateString = string;
type TFiatCurrency = string;
type TFiatValue = string;
type TAddress = string;
type TEmailAddress = string;
type TCryptoAmount = string;
type TPoolFee = number;
type TRampFee = number;
type TAssetExchangeRate = number;
type TPurchaseHash = string;
type TActionID = string;
type TNewActionStatus = string;
type TActionTimestamp = string;
type TActionDetails = string;
type TWebhookStatusUrl = string;
type TFinalUrl = string;
type TContainerNode = HTMLElement;
export type TPurchaseExternalId = string;

export interface IHostConfig {
  swapAsset?: TAsset;
  swapAmount?: TSwapAmount;
  fiatValue?: TFiatValue;
  fiatCurrency?: TFiatCurrency;
  userAddress?: TEthAddress;
  userEmailAddress?: TEmailAddress;
  hostApiKey?: THostApiKey;
  hostLogoUrl: THostLogoUrl;
  hostAppName: THostAppName;
  url?: TURL;
  variant?: AllWidgetVariants;
  webhookStatusUrl?: TWebhookStatusUrl;
  finalUrl?: TFinalUrl;
  containerNode?: TContainerNode;
  selectedCountryCode?: string;
  defaultAsset?: TAsset;
}

export interface IHostConfigWithWidgetInstanceId extends IHostConfig {
  widgetInstanceId: string;
  variant: AllWidgetVariants;
}

export interface IAssetInfo {
  address: string | null;
  symbol: string;
  name: string;
  decimals: number;
}

export interface IPurchase {
  id: TPurchaseExternalId;
  endTime: TDateString | null;
  /** @deprecated use `asset.address` */
  tokenAddress: TAddress | null;
  asset: IAssetInfo;
  escrowAddress?: TAddress;
  receiverAddress: TAddress;
  cryptoAmount: TCryptoAmount;
  /** @deprecated use `cryptoAmount` */
  ethAmount?: TCryptoAmount;
  /** @deprecated use `cryptoAmount` */
  tokenAmount?: TCryptoAmount;
  fiatCurrency: TFiatCurrency;
  fiatValue: TFiatValue;
  assetExchangeRate: TAssetExchangeRate;
  poolFee: TPoolFee;
  rampFee: TRampFee;
  purchaseHash: TPurchaseHash;
}

export interface IAction {
  id: TActionID;
  newStatus: TNewActionStatus;
  timestamp: TActionTimestamp;
  details: TActionDetails;
}

export enum EventSeverity {
  VERBOSE = 'VERBOSE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export interface IConfigError {
  fieldName: string;
  description: string;
  exampleValue?: string;
  severity: EventSeverity;
}

export interface IWidgetEvent {
  type: string;
  payload: any | null;
  internal?: boolean;
}

export enum WidgetEventTypes {
  WIDGET_CLOSE = 'WIDGET_CLOSE',
  WIDGET_CONFIG_DONE = 'WIDGET_CONFIG_DONE',
  WIDGET_CONFIG_FAILED = 'WIDGET_CONFIG_FAILED',
  PURCHASE_CREATED = 'PURCHASE_CREATED',
  PURCHASE_SUCCESSFUL = 'PURCHASE_SUCCESSFUL',
  PURCHASE_FAILED = 'PURCHASE_FAILED',
}

export enum InternalEventTypes {
  WIDGET_CLOSE_REQUEST = 'WIDGET_CLOSE_REQUEST',
  WIDGET_CLOSE_REQUEST_CANCELLED = 'WIDGET_CLOSE_REQUEST_CANCELLED',
  WIDGET_CLOSE_REQUEST_CONFIRMED = 'WIDGET_CLOSE_REQUEST_CONFIRMED',
}

export type TAllEventTypes = WidgetEventTypes | InternalEventTypes;

export interface IWidgetCloseEvent extends IWidgetEvent {
  type: WidgetEventTypes.WIDGET_CLOSE;
  payload: null;
  widgetInstanceId: string;
  internal?: false;
}

export interface IPurchaseCreatedEvent extends IWidgetEvent {
  type: WidgetEventTypes.PURCHASE_CREATED;
  payload: {
    purchase: IPurchase;
    purchaseViewToken: string;
    apiUrl: string;
  };
  widgetInstanceId: string;
  internal?: false;
}

export interface IPurchaseSuccessfulEvent extends IWidgetEvent {
  type: WidgetEventTypes.PURCHASE_SUCCESSFUL;
  payload: {
    purchase: IPurchase;
  };
  widgetInstanceId: string;
  internal?: false;
}

export interface IPurchaseFailedEvent extends IWidgetEvent {
  type: WidgetEventTypes.PURCHASE_FAILED;
  payload: null;
  widgetInstanceId: string;
  internal?: false;
}

export interface IWidgetConfigDoneEvent extends IWidgetEvent {
  type: WidgetEventTypes.WIDGET_CONFIG_DONE;
  payload: null;
  widgetInstanceId: string;
  internal?: false;
}

export interface IWidgetConfigFailedEvent extends IWidgetEvent {
  type: WidgetEventTypes.WIDGET_CONFIG_FAILED;
  payload: null;
  widgetInstanceId: string;
  internal?: false;
}

export interface IWidgetCloseRequestEvent extends IWidgetEvent {
  type: InternalEventTypes.WIDGET_CLOSE_REQUEST;
  payload: null;
  widgetInstanceId?: string;
  internal: boolean;
}

export interface IWidgetCloseRequestCancelledEvent extends IWidgetEvent {
  type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CANCELLED;
  payload: null;
  internal: true;
}

export interface IWidgetCloseRequestConfirmedEvent extends IWidgetEvent {
  type: InternalEventTypes.WIDGET_CLOSE_REQUEST_CONFIRMED;
  payload: null;
  internal: true;
}

export type TWidgetEvents =
  | IWidgetCloseEvent
  | IWidgetConfigDoneEvent
  | IWidgetConfigFailedEvent
  | IPurchaseCreatedEvent
  | IPurchaseFailedEvent
  | IPurchaseSuccessfulEvent;

export type TInternalEvents =
  | IWidgetCloseRequestEvent
  | IWidgetCloseRequestCancelledEvent
  | IWidgetCloseRequestConfirmedEvent;

export type TAllEvents = TWidgetEvents | TInternalEvents;

export type WidgetVariantTypes = 'desktop' | 'mobile' | 'hosted-desktop' | 'hosted-mobile';

export type SyntheticWidgetVariants =
  | 'hosted-auto'
  | 'auto'
  | 'embedded-desktop'
  | 'embedded-mobile';

export type AllWidgetVariants = WidgetVariantTypes | SyntheticWidgetVariants;

export type TUnsubscribeToken = string;

export type TEventListenerDict = {
  [EventType in TAllEvents['type']]: IEventListener[];
};

export interface IEventListener {
  internal: boolean;
  callback(evt: TAllEvents): any;
}
