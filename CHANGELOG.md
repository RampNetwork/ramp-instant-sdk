## [2.0.0]

### Features

- add new tab/window widget's variant `hosted-auto` | `hosted-desktop` | `hosted-mobile`

### Bug Fixes

- drop focus from activeElement before showing widget

### BREAKING CHANGES

- `domNodes` is now optional and it's available only when widget's variant is `auto` | `desktop` | `mobile`
