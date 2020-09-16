# Ramp Instant SDK

`@ramp-network/ramp-instant-sdk` is a library that allows you to easily integrate the Ramp Instant widget into your web app and communicate with it.

It's not necessary to use it, although it's strongly recommended.

It's written with TypeScript, so you get all of the typings out of the box - always up-to-date.

## Installation

You can find the package here - [https://www.npmjs.com/package/@ramp-network/ramp-instant-sdk](https://www.npmjs.com/package/@ramp-network/ramp-instant-sdk).

Install via Yarn:

```
yarn add @ramp-network/ramp-instant-sdk
```

Install via npm:

```
npm install @ramp-network/ramp-instant-sdk
```

## Example usage

```javascript
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';

new RampInstantSDK({
  hostAppName: 'yourDApp',
  hostLogoUrl: 'https://yourdapp.com/yourlogo.png',
  swapAmount: '150000000000000000000', // 150 ETH in wei
  swapAsset: 'ETH',
  userAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
})
  .on('*', (event) => console.log(event))
  .show();

// That's it!
```

You can also see an example app using the SDK [here](https://github.com/RampNetwork/ramp-instant-demo-app).

## Initialization & configuration

`@ramp-network/ramp-instant-sdk` exports the `RampInstantSDK` class. As a principle, one instance of the class corresponds to one instance of the widget. If a user closes the widget, you need to create a new instance of the `RampInstantSDK` class.

### Configuration

`RampInstantSDK` constructor accepts a configuration object with the following keys:

- `swapAsset` - either a single asset `'ETH'` | `'DAI'` | `USDC` or a comma separated list of assets that should be displayed (optional),
- `swapAmount` - amount that the user will buy, in wei or token units, as a string (optional),
- `fiatValue` - gross fiat value of the purchase that will be suggested to the user (optional, has to be used with `fiatCurrency`)
- `fiatCurrency` - fiat currency of the purchase that will be suggested to the user (optional, has to be used with `fiatValue`)
- `hostLogoUrl` - a URL to your app's logo,
- `hostAppName` - your app's name,
- `userAddress` - your user's ETH address,
- `webhookStatusUrl` - your webhook URL for status updates (optional).
- `variant` - determines how the widget is displayed `auto` | `hosted-auto` | `desktop` | `mobile` | `hosted-desktop` | `hosted-mobile` (optional)
- `finalUrl` - allows you to redirect the user to a given URL after purchase (optional, available only in hosted variants)

If any of the supplied config values are invalid, you'll be notified about it via the console in your devtools.

If you fail to supply any of the required config values, the widget will display an error page and won't start.

### Initialization

Just call `new RampInstantSDK(config)` - this will run some prep work for the widget, but won't display it yet. In order to display the widget, run `.show()` on your instance of the `RampInstantSDK` class.

`.show()` adds the widget to the DOM - specifically, to the `body` element - starting from that moment, the semi-transparent overlay with a loader appears and the widget starts booting up.

P.S. `.show()` is chainable.

## Events

Ramp Instant widget sends some events that you can react to in your web app.

Each event has the following fields:

- `type` - type of the event, i.e. what happened,
- `payload` - any additional info related to the event,
- `widgetInstanceId` - a random number-string - each widget instance has its own. You can use this if you have many instances of the widget and want to distinguish which event came from which instance.

### Available events

```javascript
// Sent when the widget is closed
{
  type: 'WIDGET_CLOSE',
  payload: null,
  widgetInstanceId: string,
}

// Sent when a purchase is created, but not yet fulfilled
{
  type: 'PURCHASE_CREATED',
  payload: {
    purchase: IPurchase,
    purchaseViewToken: string,
    apiUrl: string,
  },
  widgetInstanceId: string,
}

// Sent when the user receives their crypto
{
  type: 'PURCHASE_SUCCESSFUL',
  payload: {
    purchase: RampInstantPurchase,
  },
  widgetInstanceId: string,
}

// Sent when a purchase fails (for any reason)
{
  type: 'PURCHASE_FAILED',
  payload: null,
  widgetInstanceId: string,
}

// Sent when the widget is done fetching internal configuration and can be displayed.
// This is when the loader hides.
// NOTE: it's done automatically, you can call `.show()` immediately without waiting for this event
{
  type: 'WIDGET_CONFIG_DONE',
  payload: null,
  widgetInstanceId: string,
}

// Sent when the widget failed fetching internal configuration.
// This is when the loader hides.
// NOTE: it's done automatically, you can call `.show()` immediately without waiting for this event
{
  type: 'WIDGET_CONFIG_FAILED',
  payload: null,
  widgetInstanceId: string,
}

// Sent when a user wants to close the widget and a confirmation modal is displayed
{
  type: 'WIDGET_CLOSE_REQUEST',
  payload: null,
  widgetInstanceId?: string,
}

// Sent when a user cancels closing the widget window
{
  type: 'WIDGET_CLOSE_REQUEST_CANCELLED',
  payload: null,
}

// Sent when a user confirms closing the widget - this ends the flow
{
  type: 'WIDGET_CLOSE_REQUEST_CONFIRMED',
  payload: null,
}
```

The package also exports a `RampInstantEvents` types which is a type containing all possible events and `RampInstantEventTypes` which is an enum of all possible event `type` values.

### Purchase object

Events like `PURCHASE_CREATED` and `PURCHASE_SUCCESSFUL` expose an object with the following details of the purchase.

```javascript
id: number;
endTime: string | null; // datestring
tokenAddress: string | null; // [DEPRECATED - use asset.address] 0x-prefixed ETH address
asset: AssetInfo;  // description of the purchased asset (address, symbol, name, decimals)
escrowAddress?: string; // 0x-prefixed ETH address
receiverAddress: string // 0x-prefixed ETH address of the buying user
cryptoAmount: string; // number-string, in wei or token units
ethAmount?: string; // [DEPRECATED - use cryptoAmount] cryptoAmount for ETH purchases
tokenAmount?: string; // [DEPRECATED - use cryptoAmount] cryptoAmount for token purchases
fiatCurrency: string; // three-letter currency code
fiatValue: string; // number-string
assetExchangeRate: number;
poolFee: string; // number-string, seller fee in ETH
rampFee: string;  // number-string, Ramp fee in ETH
purchaseHash: string; // 0x-prefixed hash of certain purchase details
actions: object[]; // Low-level state changes of the purchase
```

See [full reference of the `RampInstantPurchase` type](https://docs-instant.ramp.network/reference/sdk/js/#rampinstantpurchase-object) in our docs.

### Subscribing to events

In order to subscribe to an event, use the `.on(eventType, callback)` method on your SDK instance.

The `.on(eventType, callback)` method accepts either a string with the event's `type` when you want to subscribe to a specific kind of an event or `'*'` for subscribing to any event.

`callback` is called each time a given event occurs.

In order to unsubscribe, call the `.unsubscribe(eventType, callback)` method with the event type and handler you want to stop receiving updates for.

P.S. `.on(eventType, callback)` and `.unsubscribe(eventType, callback)` are chainable.

## Widget's DOM nodes

For popup widget version (`variant: "auto|mobile|desktop"`) `RampInstantSDK` instance exposes a `domNodes` field that contains `body`, `iframe`, `overlay`, `shadowHost` and `shadow` elements.

`body` is a reference to your app's `<body>` element.

`iframe` is a reference to the widget's `<iframe>`.

`overlay` is a reference to the semi-transparent backdrop for the widget.

`shadowHost` is a reference to the node where all widget-related elements are kept.

`shadow` is a reference to the widget's shadow DOM root.

## Widget's window reference

For hosted widget version (`variant: "hosted-auto|hosted-mobile|hosted-desktop"`) `RampInstantSDK` instance exposes a `widgetWindow` field that is a reference to the created window.

## API Reference

### `new RampInstantSDK(config): RampInstantSDK`

Creates an instance of the SDK.

Params:

```javascript
{
  // *optional*
  // 'ETH', 'DAI' or 'USDC' or a comma-separated list of those
  swapAsset?: string;

  // *optional*
  // int string - wei or token units
  swapAmount?: string;

  // *optional*
  // int string
  // has to be used together with `fiatCurrency`
  fiatValue?: string;

  // *optional*
  // "EUR" or "GBP"
  // has to be used together with `fiatValue`
  fiatCurrency?: string;

  // *optional*
  // 0x-prefixed ETH address of the buyer
  userAddress?: string;

  // URL to your app's logo
  hostLogoUrl: string;

  // your app's name
  hostAppName: string;

  // *optional*
  // allows to provide an alternative URL to load
  // a non-production version of the widget
  url?: string;

  // *optional*
  // allows you to choose how the widget is displayed
  // 'auto' displays widget in the popup iframe, widget version (desktop|mobile) is determined automatically
  // 'hosted-auto' opens widget in new tab/window, widget version (desktop|mobile) is determined automatically
  // 'desktop' | 'hosted-desktop' forces the widget to use the desktop version
  // 'mobile' | | 'hosted-mobile' forces the widget to use the mobile version
  variant?: 'auto' | 'hosted-auto' | 'desktop' | 'mobile' | 'hosted-desktop' | 'hosted-mobile';

  // *optional*
  // if you chose one of the hosted variants, you can choose a URL the user will be redirected to
  // after their purchase is completed
  finalUrl?: string;

  // *optional*
  // your URL for webhook updates
  webhookStatusUrl?: string;
}
```

Note: this also fetches the Poppins font which will be used by the widget.

### Instance methods

#### `on(type: RampInstantEventTypes | '*', callback: (event: RampInstantEvents) => void): sdkInstance`

Registers the `callback` to be called each time an event with the given `type` is dispatched. If `type` is `'*'`, `callback` will be called for every event, regardless of its type.

Returns the instance of the SDK it was called on.

#### `unsubscribe(type: RampInstantEventTypes | '*', callback: (event: RampInstantEvents) => void): sdkInstance`

Allows you to unsubscribe from receiving updates for a given event type and handler.

Returns the instance of the SDK it was called on.

#### `show(): sdkInstance`

Initializes the widget and adds it to your webapp's DOM.

Note: this can be only called once per SDK instance - if you want to open the widget again, you need to create a new one.

## Contact us

If you want to get in touch, join our Discord server [here](https://discord.gg/gPDbBGQ).
