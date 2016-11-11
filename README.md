# rollup-plugin-re

Power rollup replace plugin with RegExp supported.

## Installation

```
npm install --save-dev rollup-plugin-re
```

## Usage
```js
import { rollup } from 'rollup'
import replace from 'rollup-plugin-re'
import commonjs from 'rollup-plugin-commonjs'
rollup({
  entry: 'main.js',
  plugins: [
    replace({
      // ... do replace before commonjs
      patterns: [
        {
          // regexp match with resolved path
          match: /formidable(\/|\\)lib/, 
          // string or regexp
          test: 'if (global.GENTLY) require = GENTLY.hijack(require);', 
          // string replaced
          replace: '',
        }
      ]
    }),
    commonjs(),
    replace({
       // ... do replace after commonjs
    })
  ]
}).then(...)
```

## Options

```javascript
{
  // a minimatch pattern, or array of patterns, of files that
  // should be processed by this plugin (if omitted, all files
  // are included by default)...
  include: 'config.js',

  // ...and those that shouldn't, if `include` is otherwise
  // too permissive
  exclude: 'node_modules/**',
  patterns: [
    {
      include: [], // same as above
      exclude: [], // same as above
      // regexp match with resolved path
      match: /formidable(\/|\\)lib/, 
      // string or regexp
      test: 'if (global.GENTLY) require = GENTLY.hijack(require);', 
      // string replaced
      replace: '',
    }
  ]
}
```