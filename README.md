# webpack-httpolyglot-server

> Using [httpolyglot](https://github.com/mscdex/httpolyglot) to serve http/https over the same port for Webpack development server

## Yoroi Classic maintenance

This fork is maintained for the Yoroi Classic extension development toolchain. It is consumed from GitHub and is not published to npmjs.

## Why?

The original package was created for the [React Chrome Extension Boilerplate](https://github.com/jhen0409/react-chrome-extension-boilerplate), which needed an HTTPS webpack server in development mode for injected pages while still serving HTTP for window, popup, and background pages. This package keeps those flows on one webpack development server.

## Installation

Pin the owned fork as a Git dependency:

```bash
$ npm i --save-dev webpack-hot-middleware
$ npm i --save-dev git+https://github.com/yoroi-classic/webpack-httpolyglot-server.git
```

For reproducible builds, prefer a commit or branch ref in the consuming package:

```json
{
  "devDependencies": {
    "webpack-httpolyglot-server": "git+https://github.com/yoroi-classic/webpack-httpolyglot-server.git#master"
  }
}
```

## Usage

#### CLI

Not yet.

#### Node

```js
var createWebpackServer = require('webpack-httpolyglot-server');

const server = createWebpackServer(config, serverOptions);
```

The `config` can be Array, it can use multiple config.

## Configuration

#### output.publicPath

Use `//` as a prefix instead of `http://` or `https://`, but if you're making chrome extension (prefix: `chrome-extension://`), it's not applicable.

#### `webpack-hot-middleware` [entry](https://github.com/glenjamin/webpack-hot-middleware#config)

This tool used `webpack-hot-middleware` for enable hot module replacement.

#### devMiddleware

Apply [webpack-dev-middleware](https://github.com/webpack/webpack-dev-middleware) options.

#### hotMiddleware

Apply [webpack-hot-middleware](https://github.com/glenjamin/webpack-hot-middleware) options.

## Credits

* The SSL keys is copied from [webpack-dev-server](https://github.com/webpack/webpack-dev-server/tree/master/ssl).

## License

[MIT](LICENSE.md)
