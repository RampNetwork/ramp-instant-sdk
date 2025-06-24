## [6.0.3]

### Bug Fixes

- Stringify config booleans such as `credentialless`.

## [6.0.2]

### Bug Fixes

- Apply `credentialless` to non-overlay variants.

## [6.0.1]

### Bug Fixes

- Don't invoke event listeners for unknown event types.

## [6.0.0]

### Features

- Added new config option `credentialless` to control `iframe`'s `credentialless` attribute.
- Removed unused `body-scroll-lock` dependency.

### BREAKING CHANGES

- The `credentialless` attribute for the Widget's `iframe` (used in both embedded and overlay integrations) **is now disabled by default**. You can re-enable it by setting the `credentialless` property in the SDK configuration. Please note that enabling `credentialless` prevents storage from being preserved between sessions and may break password managers and social logins.

## [5.0.3]

### Bug Fixes

- Fixed broken `top` CSS property for overlay.

## [5.0.0]

### Features

- Introduced `APP_VERSION` event to trigger visual and behavioral adjustments for the new Widget:
  - The iframe now dynamically resizes based on its container or viewport.
  - Minimum width and height restrictions for embedded containers have been removed.
  - Escape key handling is now delegated to the Widget itself instead of the SDK.
  - The Widget is displayed as early as possible (instead of waiting for `WIDGET_CONFIG_DONE`), leveraging the app’s own loading state. The SDK’s spinner remains only until the iframe is fully loaded.
- Overlay background is now consistently black with 50% opacity across all app versions. This avoids flickering due to unknown app version at initial load time.
- Embedded `containerNode` restrictions have been lifted regardless of the app version, for the same reason - the app version isn't known prior to load.
- New `closeable` query parameter added to control the new Widget’s close functionality. If not provided, the value is inferred from the variant.
- Replaced `body-scroll-lock` with custom implementation
- Removed `hideWebsiteBelow()`.
- Minor code formatting improvements.

## [2.0.0]

### Features

- add new tab/window widget's variant `hosted-auto` | `hosted-desktop` | `hosted-mobile`

### Bug Fixes

- drop focus from activeElement before showing widget

### BREAKING CHANGES

- `domNodes` is now optional and it's available only when widget's variant is `auto` | `desktop` | `mobile`
