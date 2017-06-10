[![Build Status](https://travis-ci.org/jetiny/rollup-plugin-re.svg?branch=master)](https://travis-ci.org/jetiny/rollup-plugin-re)

# rollup-plugin-re

Power rollup content transform plugin.

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
          // string or function to replaced with
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

## Define macro pre-processor 

use `defines` options to remove macro blocks

### Options
```javascript
{
  defines: {
    IS_SKIP: false,
    IS_REMOVE: true,
  }
}
```

### input
```javascript
// #if IS_SKIP
  console.log('!Skip!')
// #endif
// #if IS_REMOVE
console.log('!Remove!')
// #endif
```

### output
```javascript
// #if IS_SKIP
  console.log('!Skip!')
// #endif
```


## Replace

use `replaces` options to quick replace text

### Options
```javascript
{
  replaces: {
    $version: "1.0.1"
  }
}
```

### input
```javascript
  console.log('$version')
```

### output
```javascript
  console.log('1.0.1')
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
  defines: {
    IS_SKIP: false,
    IS_REMOVE: true,
  },
  replaces: {
    $version: "1.0.1"
  },
  patterns: [
    {
      include: [], // same as above
      exclude: [], // same as above
      // regexp match with resolved path
      match: /formidable(\/|\\)lib/, 
      // string or regexp
      test: 'if (global.GENTLY) require = GENTLY.hijack(require);', 
      // string or function
      replace: '',
    },
    // replace whole file content
    {
      text: 'exports = "content"', // replace content with given text
    },
    {
      file: './replace.js', // replace with given relative file
    },
    {
      transform (code, id) { // replace by function
        return `'use strict';\n${code}`
      }
    }
  ]
}
```
