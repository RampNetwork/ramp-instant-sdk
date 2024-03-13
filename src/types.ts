import { SEND_CRYPTO_SUPPORTED_VERSION } from './consts';

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
type TAssetExchangeRate = number;
type TFinalTxHash = string;
type TActionID = string;
type TNewActionStatus = string;
type TActionTimestamp = string;
type TActionDetails = string;
type TWebhookStatusUrl = string;
type TFinalUrl = string;
type TContainerNode = HTMLElement;
type TFlow = 'ONRAMP' | 'OFFRAMP';

export enum PaymentMethodName {
  SEPA = 'SEPA',
  CARD = 'CARD',
  APPLEPAY = 'APPLEPAY',
  GOOGLEPAY = 'GOOGLEPAY',
  PISP = 'PISP',
  SOFORT = 'SOFORT',
  PIX = 'PIX',
}

export enum PurchaseStatus {
  INITIALIZED = 'INITIALIZED',
  PAYMENT_STARTED = 'PAYMENT_STARTED',
  PAYMENT_IN_PROGRESS = 'PAYMENT_IN_PROGRESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_EXECUTED = 'PAYMENT_EXECUTED',
  FIAT_RECEIVED = 'FIAT_RECEIVED',
  FIAT_SENT = 'FIAT_SENT',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  RELEASING = 'RELEASING',
  RELEASED = 'RELEASED',
}

export type TPurchaseExternalId = string;

export interface IHostConfig {
  swapAsset?: TAsset;
  offrampAsset?: TAsset;
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
  defaultFlow?: TFlow;
  enabledFlows?: TFlow[];
  offrampWebhookV3Url?: TWebhookStatusUrl;
  useSendCryptoCallback?: boolean;
  paymentMethodType?: PaymentMethodName;
}

export interface IHostConfigWithSdkParams extends Omit<IHostConfig, 'useSendCryptoCallback'> {
  sdkType: 'WEB';
  sdkVersion: string;
  widgetInstanceId: string;
  variant: AllWidgetVariants;
  useSendCryptoCallbackVersion?: typeof SEND_CRYPTO_SUPPORTED_VERSION;
}

export interface IAssetInfo {
  address: string | null;
  symbol: string;
  type: string;
  name: string;
  decimals: number;
}

export interface IPurchase {
  id: TPurchaseExternalId;
  endTime: TDateString | null;
  asset: IAssetInfo;
  receiverAddress: TAddress;
  cryptoAmount: TCryptoAmount;
  fiatCurrency: TFiatCurrency;
  fiatValue: TFiatValue;
  assetExchangeRate: TAssetExchangeRate;
  baseRampFee: TFiatValue;
  networkFee: TFiatValue;
  appliedFee: TFiatValue;
  paymentMethodType: PaymentMethodName;
  finalTxHash?: TFinalTxHash;
  createdAt: TDateString;
  updatedAt: TDateString;
  status: PurchaseStatus;
}

export interface AssetInfo {
  address: string | null;
  symbol: string;
  chain: string;
  type: string;
  name: string;
  decimals: number;
}

export interface IOfframpSale {
  id: string;
  createdAt: string;
  crypto: {
    amount: string;
    assetInfo: AssetInfo;
  };
  fiat: {
    amount: number;
    currencySymbol: string;
  };
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
  OFFRAMP_SALE_CREATED = 'OFFRAMP_SALE_CREATED',
}

export enum InternalEventTypes {
  WIDGET_CLOSE_REQUEST = 'WIDGET_CLOSE_REQUEST',
  WIDGET_CLOSE_REQUEST_CANCELLED = 'WIDGET_CLOSE_REQUEST_CANCELLED',
  WIDGET_CLOSE_REQUEST_CONFIRMED = 'WIDGET_CLOSE_REQUEST_CONFIRMED',
  REQUEST_CRYPTO_ACCOUNT = 'REQUEST_CRYPTO_ACCOUNT',
  SEND_CRYPTO = 'SEND_CRYPTO',
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

export interface IOfframpSaleCreatedEvent extends IWidgetEvent {
  type: WidgetEventTypes.OFFRAMP_SALE_CREATED;
  payload: {
    sale: IOfframpSale;
    saleViewToken: string;
    apiUrl: string;
  };
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

export interface IRequestCryptoAccountEvent extends IWidgetEvent {
  type: InternalEventTypes.REQUEST_CRYPTO_ACCOUNT;
  payload: {
    type: string;
    assetSymbol: string;
  };
  widgetInstanceId?: string;
}

export interface ISendCryptoEvent extends IWidgetEvent {
  eventVersion: typeof SEND_CRYPTO_SUPPORTED_VERSION;
  type: InternalEventTypes.SEND_CRYPTO;
  payload: {
    assetInfo: AssetInfo;
    amount: string;
    address: string;
  };
  widgetInstanceId?: string;
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
  | IOfframpSaleCreatedEvent;

export type TInternalEvents =
  | IWidgetCloseRequestEvent
  | IWidgetCloseRequestCancelledEvent
  | IWidgetCloseRequestConfirmedEvent
  | IRequestCryptoAccountEvent
  | ISendCryptoEvent;

export enum InternalSdkEventTypes {
  REQUEST_CRYPTO_ACCOUNT_RESULT = 'REQUEST_CRYPTO_ACCOUNT_RESULT',
  SEND_CRYPTO_RESULT = 'SEND_CRYPTO_RESULT',
}

export interface IRequestCryptoAccountResultEvent extends IWidgetEvent {
  type: InternalSdkEventTypes.REQUEST_CRYPTO_ACCOUNT_RESULT;
  payload:
    | IOnRequestCryptoAccountResult
    | {
        error: string | undefined;
      };
  widgetInstanceId?: string;
}

export interface ISendCryptoResultEvent extends IWidgetEvent {
  eventVersion: typeof SEND_CRYPTO_SUPPORTED_VERSION;
  type: InternalSdkEventTypes.SEND_CRYPTO_RESULT;
  payload:
    | IOnSendCryptoResult
    | {
        error: string | undefined;
      };
  widgetInstanceId?: string;
}

export type TSdkEvents = IRequestCryptoAccountResultEvent | ISendCryptoResultEvent;

export type TAllEvents = TWidgetEvents | TInternalEvents;

export type WidgetVariantTypes =
  | 'desktop'
  | 'mobile'
  | 'hosted-desktop'
  | 'hosted-mobile'
  | 'webview-desktop'
  | 'webview-mobile';

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

export interface IOnRequestCryptoAccountResult {
  address: string;
  type?: string;
  name?: string;
  assetSymbol?: string;
}

export interface IOnSendCryptoResult {
  txHash: string;
}

export type TOnRequestCryptoAccountCallback = (
  type: string,
  assetSymbol: string
) => Promise<IOnRequestCryptoAccountResult>;

export type TOnSendCryptoCallback = (
  assetInfo: AssetInfo,
  amount: string,
  address: string
) => Promise<IOnSendCryptoResult>;
