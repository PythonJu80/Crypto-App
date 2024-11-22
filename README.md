# 🚀 Crypto-App

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js CI](https://github.com/PythonJu80/Crypto-App/actions/workflows/node.js.yml/badge.svg)](https://github.com/PythonJu80/Crypto-App/actions/workflows/node.js.yml)

A comprehensive cryptocurrency trading and portfolio management application featuring real-time analytics, automated trading strategies, and advanced portfolio tracking.

## ✨ Features

- 📊 **Real-Time Analytics**
  - Live market data visualization
  - Interactive trading charts
  - Performance metrics dashboard

- 🔄 **WebSocket Integration**
  - Low-latency market data updates
  - Real-time trade execution feedback
  - Live order book updates

- 💼 **Portfolio Management**
  - Detailed holdings breakdown
  - Performance analysis tools
  - Historical tracking

- 🤖 **Smart Trading**
  - Automated reinvestment strategies
  - Custom trading rules engine
  - Risk management tools

- 🔔 **Alert System**
  - Price movement notifications
  - Portfolio balance alerts
  - Custom trigger conditions

- 🔐 **Security**
  - End-to-end encryption
  - Secure API endpoints
  - Two-factor authentication

## 🛠️ Tech Stack

- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: SQLite
- **WebSocket**: ws library
- **Testing**: Jest, Cypress
- **CI/CD**: GitHub Actions
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- SQLite

## 🚀 Getting Started

### Step 1: Clone the repository
```bash
git clone https://github.com/PythonJu80/Crypto-App.git && cd Crypto-App
```
<button onclick="navigator.clipboard.writeText('git clone https://github.com/PythonJu80/Crypto-App.git && cd Crypto-App')">Copy</button>

### Step 2: Install dependencies
```bash
npm install
```
<button onclick="navigator.clipboard.writeText('npm install')">Copy</button>

### Step 3: Set up environment variables
```bash
cp .env.example .env
```
<button onclick="navigator.clipboard.writeText('cp .env.example .env')">Copy</button>

### Step 4: Initialize the database
```bash
node src/database/seed.js
```
<button onclick="navigator.clipboard.writeText('node src/database/seed.js')">Copy</button>

### Step 5: Start development server
```bash
npm run dev
```
<button onclick="navigator.clipboard.writeText('npm run dev')">Copy</button>

## 📁 Project Structure

```
Crypto-App/
.
├── babel.config.js
├── .babelrc
├── .bolt
│   └── config.json
├── config
│   └── config-manager.js
├── coverage
│   ├── clover.xml
│   ├── coverage-final.json
│   ├── lcov.info
│   └── lcov-report
├── dist
│   ├── index.html
│   ├── manifest.json
│   ├── offline.html
│   ├── offline.html.br
│   ├── offline.html.gz
│   ├── service-worker.js
│   ├── service-worker.js.br
│   ├── service-worker.js.gz
│   └── static
├── docs
│   ├── AUDIT_METRICS.md
│   ├── AUDIT_REPORT.md
│   ├── AUDIT_SECURITY.md
│   ├── MONITORING.md
│   ├── PEPE_THEME.md
│   └── PROJECT_REPORT.md
├── .env
├── .env.development
├── .env.example
├── .env.production
├── .env.production.example
├── .eslintrc.json
├── .git
│   ├── branches
│   ├── COMMIT_EDITMSG
│   ├── config
│   ├── description
│   ├── HEAD
│   ├── hooks
│   ├── index
│   ├── info
│   ├── logs
│   ├── objects
│   ├── packed-refs
│   └── refs
├── .github
│   └── workflows
├── .gitignore
├── index.html
├── index.js
├── jest.config.js
├── logs
├── monitoring
│   └── monitor.js
├── node_modules
│   ├── abab
│   ├── abbrev
│   ├── abort-controller
│   ├── accepts
│   ├── acorn
│   ├── acorn-globals
│   ├── acorn-jsx
│   ├── acorn-walk
│   ├── @adobe
│   ├── agent-base
│   ├── agentkeepalive
│   ├── aggregate-error
│   ├── ajv
│   ├── @alloc
│   ├── @ampproject
│   ├── ansi-escapes
│   ├── ansi-regex
│   ├── ansi-styles
│   ├── anymatch
│   ├── any-promise
│   ├── aproba
│   ├── are-we-there-yet
│   ├── arg
│   ├── argparse
│   ├── aria-query
│   ├── array-buffer-byte-length
│   ├── arraybuffer.prototype.slice
│   ├── array-flatten
│   ├── array-includes
│   ├── array.prototype.findlast
│   ├── array.prototype.flat
│   ├── array.prototype.flatmap
│   ├── array.prototype.tosorted
│   ├── asap
│   ├── async
│   ├── asynckit
│   ├── at-least-node
│   ├── atomic-sleep
│   ├── autoprefixer
│   ├── available-typed-arrays
│   ├── axios
│   ├── @babel
│   ├── babel-jest
│   ├── babel-plugin-istanbul
│   ├── babel-plugin-jest-hoist
│   ├── babel-plugin-polyfill-corejs2
│   ├── babel-plugin-polyfill-corejs3
│   ├── babel-plugin-polyfill-regenerator
│   ├── babel-preset-current-node-syntax
│   ├── babel-preset-jest
│   ├── balanced-match
│   ├── base64-js
│   ├── @bcoe
│   ├── .bin
│   ├── binary-extensions
│   ├── bindings
│   ├── bl
│   ├── body-parser
│   ├── brace-expansion
│   ├── braces
│   ├── browserslist
│   ├── bser
│   ├── buffer
│   ├── buffer-equal-constant-time
│   ├── buffer-from
│   ├── @bundled-es-modules
│   ├── bytes
│   ├── cacache
│   ├── call-bind
│   ├── callsites
│   ├── camelcase
│   ├── camelcase-css
│   ├── caniuse-lite
│   ├── chalk
│   ├── char-regex
│   ├── chokidar
│   ├── chownr
│   ├── ci-info
│   ├── cjs-module-lexer
│   ├── clean-stack
│   ├── cliui
│   ├── cli-width
│   ├── clone
│   ├── clsx
│   ├── co
│   ├── collect-v8-coverage
│   ├── color-convert
│   ├── colorette
│   ├── color-name
│   ├── color-support
│   ├── combined-stream
│   ├── commander
│   ├── common-tags
│   ├── component-emitter
│   ├── compressible
│   ├── compression
│   ├── concat-map
│   ├── console-control-strings
│   ├── content-disposition
│   ├── content-type
│   ├── convert-source-map
│   ├── cookie
│   ├── cookiejar
│   ├── cookie-signature
│   ├── core-js-compat
│   ├── cors
│   ├── create-jest
│   ├── cross-spawn
│   ├── crypto-random-string
│   ├── cssesc
│   ├── css.escape
│   ├── cssom
│   ├── cssstyle
│   ├── csstype
│   ├── d3-array
│   ├── d3-color
│   ├── d3-ease
│   ├── d3-format
│   ├── d3-interpolate
│   ├── d3-path
│   ├── d3-scale
│   ├── d3-shape
│   ├── d3-time
│   ├── d3-time-format
│   ├── d3-timer
│   ├── data-urls
│   ├── data-view-buffer
│   ├── data-view-byte-length
│   ├── data-view-byte-offset
│   ├── dateformat
│   ├── debug
│   ├── decimal.js
│   ├── decimal.js-light
│   ├── decompress-response
│   ├── dedent
│   ├── deep-equal
│   ├── deep-extend
│   ├── deep-is
│   ├── deepmerge
│   ├── define-data-property
│   ├── define-properties
│   ├── delayed-stream
│   ├── delegates
│   ├── depd
│   ├── dequal
│   ├── destroy
│   ├── detect-libc
│   ├── detect-newline
│   ├── dezalgo
│   ├── didyoumean
│   ├── diff-sequences
│   ├── dlv
│   ├── doctrine
│   ├── dom-accessibility-api
│   ├── domexception
│   ├── dom-helpers
│   ├── dotenv
│   ├── eastasianwidth
│   ├── ecdsa-sig-formatter
│   ├── ee-first
│   ├── ejs
│   ├── electron-to-chromium
│   ├── emittery
│   ├── emoji-regex
│   ├── @emotion
│   ├── encodeurl
│   ├── encoding
│   ├── end-of-stream
│   ├── engine.io-client
│   ├── engine.io-parser
│   ├── entities
│   ├── env-paths
│   ├── err-code
│   ├── error-ex
│   ├── es-abstract
│   ├── @esbuild
│   ├── esbuild
│   ├── escalade
│   ├── escape-html
│   ├── escape-string-regexp
│   ├── escodegen
│   ├── es-define-property
│   ├── es-errors
│   ├── es-get-iterator
│   ├── es-iterator-helpers
│   ├── @eslint
│   ├── eslint
│   ├── @eslint-community
│   ├── eslint-config-prettier
│   ├── eslint-plugin-react
│   ├── eslint-plugin-react-hooks
│   ├── eslint-scope
│   ├── eslint-visitor-keys
│   ├── es-object-atoms
│   ├── espree
│   ├── esprima
│   ├── esquery
│   ├── esrecurse
│   ├── es-set-tostringtag
│   ├── es-shim-unscopables
│   ├── es-to-primitive
│   ├── estraverse
│   ├── estree-walker
│   ├── esutils
│   ├── etag
│   ├── eventemitter3
│   ├── events
│   ├── event-target-shim
│   ├── execa
│   ├── exit
│   ├── expand-template
│   ├── expect
│   ├── express
│   ├── express-rate-limit
│   ├── fast-copy
│   ├── fast-deep-equal
│   ├── fast-equals
│   ├── fast-glob
│   ├── fast-json-stable-stringify
│   ├── fast-levenshtein
│   ├── fastq
│   ├── fast-redact
│   ├── fast-safe-stringify
│   ├── fast-uri
│   ├── fb-watchman
│   ├── file-entry-cache
│   ├── filelist
│   ├── file-uri-to-path
│   ├── fill-range
│   ├── finalhandler
│   ├── find-up
│   ├── flat-cache
│   ├── flatted
│   ├── follow-redirects
│   ├── for-each
│   ├── foreground-child
│   ├── form-data
│   ├── formidable
│   ├── forwarded
│   ├── fraction.js
│   ├── fresh
│   ├── fs-constants
│   ├── fs-extra
│   ├── fs-minipass
│   ├── fs.realpath
│   ├── function-bind
│   ├── function.prototype.name
│   ├── functions-have-names
│   ├── @gar
│   ├── gauge
│   ├── gensync
│   ├── get-caller-file
│   ├── get-intrinsic
│   ├── get-own-enumerable-property-symbols
│   ├── get-package-type
│   ├── get-stream
│   ├── get-symbol-description
│   ├── github-from-package
│   ├── glob
│   ├── globals
│   ├── globalthis
│   ├── glob-parent
│   ├── gopd
│   ├── graceful-fs
│   ├── graphemer
│   ├── graphql
│   ├── harmony-reflect
│   ├── has-bigints
│   ├── has-flag
│   ├── hasown
│   ├── has-property-descriptors
│   ├── has-proto
│   ├── has-symbols
│   ├── has-tostringtag
│   ├── has-unicode
│   ├── headers-polyfill
│   ├── @headlessui
│   ├── helmet
│   ├── help-me
│   ├── @heroicons
│   ├── hexoid
│   ├── html-encoding-sniffer
│   ├── html-escaper
│   ├── http-cache-semantics
│   ├── http-errors
│   ├── http-proxy-agent
│   ├── https-proxy-agent
│   ├── humanize-ms
│   ├── human-signals
│   ├── @humanwhocodes
│   ├── iconv-lite
│   ├── idb
│   ├── identity-obj-proxy
│   ├── ieee754
│   ├── ignore
│   ├── immediate
│   ├── import-fresh
│   ├── import-local
│   ├── imurmurhash
│   ├── indent-string
│   ├── infer-owner
│   ├── inflight
│   ├── inherits
│   ├── ini
│   ├── @inquirer
│   ├── internal-slot
│   ├── internmap
│   ├── ip-address
│   ├── ipaddr.js
│   ├── @isaacs
│   ├── is-arguments
│   ├── isarray
│   ├── is-array-buffer
│   ├── is-arrayish
│   ├── is-async-function
│   ├── is-bigint
│   ├── is-binary-path
│   ├── is-boolean-object
│   ├── is-callable
│   ├── is-core-module
│   ├── is-data-view
│   ├── is-date-object
│   ├── isexe
│   ├── is-extglob
│   ├── is-finalizationregistry
│   ├── is-fullwidth-code-point
│   ├── is-generator-fn
│   ├── is-generator-function
│   ├── is-glob
│   ├── is-lambda
│   ├── is-map
│   ├── is-module
│   ├── is-negative-zero
│   ├── is-node-process
│   ├── is-number
│   ├── is-number-object
│   ├── is-obj
│   ├── is-path-inside
│   ├── is-potential-custom-element-name
│   ├── is-regex
│   ├── is-regexp
│   ├── is-set
│   ├── is-shared-array-buffer
│   ├── is-stream
│   ├── is-string
│   ├── is-symbol
│   ├── @istanbuljs
│   ├── istanbul-lib-coverage
│   ├── istanbul-lib-instrument
│   ├── istanbul-lib-report
│   ├── istanbul-lib-source-maps
│   ├── istanbul-reports
│   ├── is-typed-array
│   ├── is-weakmap
│   ├── is-weakref
│   ├── is-weakset
│   ├── iterator.prototype
│   ├── jackspeak
│   ├── jake
│   ├── @jest
│   ├── jest
│   ├── jest-changed-files
│   ├── jest-circus
│   ├── jest-cli
│   ├── jest-config
│   ├── jest-diff
│   ├── jest-docblock
│   ├── jest-each
│   ├── jest-environment-jsdom
│   ├── jest-environment-node
│   ├── jest-get-type
│   ├── jest-haste-map
│   ├── jest-leak-detector
│   ├── jest-matcher-utils
│   ├── jest-message-util
│   ├── jest-mock
│   ├── jest-pnp-resolver
│   ├── jest-regex-util
│   ├── jest-resolve
│   ├── jest-resolve-dependencies
│   ├── jest-runner
│   ├── jest-runtime
│   ├── jest-snapshot
│   ├── jest-util
│   ├── jest-validate
│   ├── jest-watcher
│   ├── jest-worker
│   ├── jiti
│   ├── joycon
│   ├── @jridgewell
│   ├── jsbn
│   ├── jsdom
│   ├── jsesc
│   ├── json5
│   ├── json-buffer
│   ├── jsonfile
│   ├── json-parse-even-better-errors
│   ├── jsonpointer
│   ├── json-schema
│   ├── json-schema-traverse
│   ├── json-stable-stringify-without-jsonify
│   ├── jsonwebtoken
│   ├── js-tokens
│   ├── jsx-ast-utils
│   ├── js-yaml
│   ├── jwa
│   ├── jws
│   ├── keyv
│   ├── kleur
│   ├── leven
│   ├── levn
│   ├── lie
│   ├── lilconfig
│   ├── lines-and-columns
│   ├── localforage
│   ├── locate-path
│   ├── lodash
│   ├── lodash.debounce
│   ├── lodash.includes
│   ├── lodash.isboolean
│   ├── lodash.isinteger
│   ├── lodash.isnumber
│   ├── lodash.isplainobject
│   ├── lodash.isstring
│   ├── lodash.merge
│   ├── lodash.once
│   ├── lodash.sortby
│   ├── loose-envify
│   ├── lru-cache
│   ├── lz-string
│   ├── magic-string
│   ├── make-dir
│   ├── makeerror
│   ├── make-fetch-happen
│   ├── media-typer
│   ├── merge2
│   ├── merge-descriptors
│   ├── merge-stream
│   ├── methods
│   ├── micromatch
│   ├── mime
│   ├── mime-db
│   ├── mime-types
│   ├── mimic-fn
│   ├── mimic-response
│   ├── minimatch
│   ├── minimist
│   ├── min-indent
│   ├── minipass
│   ├── minipass-collect
│   ├── minipass-fetch
│   ├── minipass-flush
│   ├── minipass-pipeline
│   ├── minipass-sized
│   ├── minizlib
│   ├── mkdirp
│   ├── mkdirp-classic
│   ├── ms
│   ├── msw
│   ├── @mswjs
│   ├── mute-stream
│   ├── mz
│   ├── nanoid
│   ├── napi-build-utils
│   ├── natural-compare
│   ├── negotiator
│   ├── node-abi
│   ├── node-addon-api
│   ├── node-cache
│   ├── node-gyp
│   ├── node-int64
│   ├── @nodelib
│   ├── node-releases
│   ├── nopt
│   ├── normalize-path
│   ├── normalize-range
│   ├── @npmcli
│   ├── npmlog
│   ├── npm-run-path
│   ├── nwsapi
│   ├── object-assign
│   ├── object.assign
│   ├── object.entries
│   ├── object.fromentries
│   ├── object-hash
│   ├── object-inspect
│   ├── object-is
│   ├── object-keys
│   ├── object.values
│   ├── once
│   ├── onetime
│   ├── on-exit-leak-free
│   ├── on-finished
│   ├── on-headers
│   ├── @open-draft
│   ├── @opentelemetry
│   ├── optionator
│   ├── outvariant
│   ├── package-json-from-dist
│   ├── .package-lock.json
│   ├── parent-module
│   ├── parse5
│   ├── parse-json
│   ├── parseurl
│   ├── path-exists
│   ├── path-is-absolute
│   ├── path-key
│   ├── path-parse
│   ├── path-scurry
│   ├── path-to-regexp
│   ├── picocolors
│   ├── picomatch
│   ├── pify
│   ├── pino
│   ├── pino-abstract-transport
│   ├── pino-pretty
│   ├── pino-std-serializers
│   ├── pirates
│   ├── pkg-dir
│   ├── @pkgjs
│   ├── p-limit
│   ├── p-locate
│   ├── p-map
│   ├── possible-typed-array-names
│   ├── postcss
│   ├── postcss-import
│   ├── postcss-js
│   ├── postcss-load-config
│   ├── postcss-nested
│   ├── postcss-selector-parser
│   ├── postcss-value-parser
│   ├── prebuild-install
│   ├── prelude-ls
│   ├── prettier
│   ├── pretty-bytes
│   ├── pretty-format
│   ├── process
│   ├── process-warning
│   ├── promise-inflight
│   ├── promise-retry
│   ├── prompts
│   ├── prop-types
│   ├── proxy-addr
│   ├── proxy-from-env
│   ├── psl
│   ├── p-try
│   ├── pump
│   ├── punycode
│   ├── pure-rand
│   ├── qs
│   ├── querystringify
│   ├── queue-microtask
│   ├── quick-format-unescaped
│   ├── randombytes
│   ├── range-parser
│   ├── raw-body
│   ├── rc
│   ├── react
│   ├── react-dom
│   ├── react-is
│   ├── react-refresh
│   ├── react-smooth
│   ├── react-transition-group
│   ├── readable-stream
│   ├── read-cache
│   ├── readdirp
│   ├── real-require
│   ├── recharts
│   ├── recharts-scale
│   ├── redent
│   ├── reflect.getprototypeof
│   ├── regenerate
│   ├── regenerate-unicode-properties
│   ├── regenerator-runtime
│   ├── regenerator-transform
│   ├── regexp.prototype.flags
│   ├── regexpu-core
│   ├── regjsgen
│   ├── regjsparser
│   ├── require-directory
│   ├── require-from-string
│   ├── requires-port
│   ├── resolve
│   ├── resolve-cwd
│   ├── resolve.exports
│   ├── resolve-from
│   ├── retry
│   ├── reusify
│   ├── rimraf
│   ├── @rollup
│   ├── rollup
│   ├── run-parallel
│   ├── safe-array-concat
│   ├── safe-buffer
│   ├── safer-buffer
│   ├── safe-regex-test
│   ├── safe-stable-stringify
│   ├── saxes
│   ├── scheduler
│   ├── secure-json-parse
│   ├── semver
│   ├── send
│   ├── @sentry
│   ├── @sentry-internal
│   ├── serialize-javascript
│   ├── serve-static
│   ├── set-blocking
│   ├── set-function-length
│   ├── set-function-name
│   ├── setprototypeof
│   ├── shebang-command
│   ├── shebang-regex
│   ├── side-channel
│   ├── signal-exit
│   ├── simple-concat
│   ├── simple-get
│   ├── @sinclair
│   ├── @sinonjs
│   ├── sisteransi
│   ├── slash
│   ├── smart-buffer
│   ├── smob
│   ├── @socket.io
│   ├── socket.io-client
│   ├── socket.io-parser
│   ├── socks
│   ├── socks-proxy-agent
│   ├── sonic-boom
│   ├── source-map
│   ├── sourcemap-codec
│   ├── source-map-js
│   ├── source-map-support
│   ├── split2
│   ├── sprintf-js
│   ├── sqlite3
│   ├── ssri
│   ├── stack-utils
│   ├── statuses
│   ├── stop-iteration-iterator
│   ├── strict-event-emitter
│   ├── string_decoder
│   ├── stringify-object
│   ├── string-length
│   ├── string.prototype.matchall
│   ├── string.prototype.repeat
│   ├── string.prototype.trim
│   ├── string.prototype.trimend
│   ├── string.prototype.trimstart
│   ├── string-width
│   ├── string-width-cjs
│   ├── strip-ansi
│   ├── strip-ansi-cjs
│   ├── strip-bom
│   ├── strip-comments
│   ├── strip-final-newline
│   ├── strip-indent
│   ├── strip-json-comments
│   ├── sucrase
│   ├── superagent
│   ├── supertest
│   ├── supports-color
│   ├── supports-preserve-symlinks-flag
│   ├── @surma
│   ├── symbol-tree
│   ├── tailwindcss
│   ├── @tanstack
│   ├── tar
│   ├── tar-fs
│   ├── tar-stream
│   ├── temp-dir
│   ├── tempy
│   ├── terser
│   ├── test-exclude
│   ├── @testing-library
│   ├── text-table
│   ├── thenify
│   ├── thenify-all
│   ├── thread-stream
│   ├── tinyglobby
│   ├── tiny-invariant
│   ├── tmpl
│   ├── toidentifier
│   ├── @tootallnate
│   ├── to-regex-range
│   ├── tough-cookie
│   ├── tr46
│   ├── ts-interface-checker
│   ├── tunnel-agent
│   ├── type-check
│   ├── typed-array-buffer
│   ├── typed-array-byte-length
│   ├── typed-array-byte-offset
│   ├── typed-array-length
│   ├── type-detect
│   ├── type-fest
│   ├── type-is
│   ├── @types
│   ├── unbox-primitive
│   ├── undici-types
│   ├── @ungap
│   ├── unicode-canonical-property-names-ecmascript
│   ├── unicode-match-property-ecmascript
│   ├── unicode-match-property-value-ecmascript
│   ├── unicode-property-aliases-ecmascript
│   ├── unique-filename
│   ├── unique-slug
│   ├── unique-string
│   ├── universalify
│   ├── unpipe
│   ├── upath
│   ├── update-browserslist-db
│   ├── uri-js
│   ├── url-parse
│   ├── util-deprecate
│   ├── utils-merge
│   ├── v8-to-istanbul
│   ├── vary
│   ├── victory-vendor
│   ├── vite
│   ├── @vitejs
│   ├── vite-plugin-compression
│   ├── vite-plugin-pwa
│   ├── @vue
│   ├── vue
│   ├── w3c-xmlserializer
│   ├── walker
│   ├── webidl-conversions
│   ├── whatwg-encoding
│   ├── whatwg-mimetype
│   ├── whatwg-url
│   ├── which
│   ├── which-boxed-primitive
│   ├── which-builtin-type
│   ├── which-collection
│   ├── which-typed-array
│   ├── wide-align
│   ├── word-wrap
│   ├── workbox-background-sync
│   ├── workbox-broadcast-update
│   ├── workbox-build
│   ├── workbox-cacheable-response
│   ├── workbox-core
│   ├── workbox-expiration
│   ├── workbox-google-analytics
│   ├── workbox-navigation-preload
│   ├── workbox-precaching
│   ├── workbox-range-requests
│   ├── workbox-recipes
│   ├── workbox-routing
│   ├── workbox-strategies
│   ├── workbox-streams
│   ├── workbox-sw
│   ├── workbox-window
│   ├── wrap-ansi
│   ├── wrap-ansi-cjs
│   ├── wrappy
│   ├── write-file-atomic
│   ├── ws
│   ├── xmlchars
│   ├── xmlhttprequest-ssl
│   ├── xml-name-validator
│   ├── y18n
│   ├── yallist
│   ├── yaml
│   ├── yargs
│   ├── yargs-parser
│   ├── yoctocolors-cjs
│   └── yocto-queue
├── package.json
├── package-lock.json
├── postcss.config.js
├── .prettierrc
├── public
│   ├── manifest.json
│   ├── offline.html
│   └── service-worker.js
├── README.md
├── scripts
│   ├── load-secrets.js
│   └── validate-build.js
├── service-worker.js
├── src
│   ├── app.js
│   ├── App.jsx
│   ├── config
│   ├── config.js
│   ├── controllers
│   ├── database
│   ├── deployment
│   ├── frontend
│   ├── hooks
│   ├── index.css
│   ├── main.jsx
│   ├── metrics.js
│   ├── middleware
│   ├── routes
│   ├── server
│   ├── server.js
│   ├── services
│   ├── tests
│   └── utils
├── tailwind.config.js
├── tests
│   ├── e2e
│   ├── integration
│   └── smoke
├── utils
│   └── rate-limiter.js
└── vite.config.js

```

## 🛠️ Available Scripts

### 👨‍💻 Development
```bash
npm run dev     # Start development server
```
<button onclick="navigator.clipboard.writeText('npm run dev')">Copy</button>

```bash
npm run lint    # Run ESLint
```
<button onclick="navigator.clipboard.writeText('npm run lint')">Copy</button>

```bash
npm run format  # Format with Prettier
```
<button onclick="navigator.clipboard.writeText('npm run format')">Copy</button>

### 🧪 Testing
```bash
npm run test        # Run all tests
```
<button onclick="navigator.clipboard.writeText('npm run test')">Copy</button>

```bash
npm run test:unit   # Run unit tests
```
<button onclick="navigator.clipboard.writeText('npm run test:unit')">Copy</button>

```bash
npm run test:ci     # Run CI tests
```
<button onclick="navigator.clipboard.writeText('npm run test:ci')">Copy</button>

### 🏭 Production
```bash
npm run build   # Build for production
```
<button onclick="navigator.clipboard.writeText('npm run build')">Copy</button>

## 🚀 Deployment

### Netlify Setup

1. Connect your repository to Netlify
2. Configure build settings:
   - **Branch**: main
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
3. Set environment variables in Netlify dashboard

## 🤝 Contributing

### Step 1: Fork the repository
First, fork the repository using the 'Fork' button on GitHub.

### Step 2: Create your feature branch
```bash
git checkout -b feature/amazing-feature
```
<button onclick="navigator.clipboard.writeText('git checkout -b feature/amazing-feature')">Copy</button>

### Step 3: Commit your changes
```bash
git commit -m "Add amazing feature"
```
<button onclick="navigator.clipboard.writeText('git commit -m "Add amazing feature"')">Copy</button>

### Step 4: Push to the branch
```bash
git push origin feature/amazing-feature
```
<button onclick="navigator.clipboard.writeText('git push origin feature/amazing-feature')">Copy</button>

### Step 5: Create a Pull Request
Go to your forked repository on GitHub and click 'Create Pull Request'.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

PythonJu80 - [GitHub Profile](https://github.com/PythonJu80)

Project Link: [https://github.com/PythonJu80/Crypto-App](https://github.com/PythonJu80/Crypto-App)
