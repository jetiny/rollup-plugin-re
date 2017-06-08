'use strict'

import test from 'ava'
import {rollup} from 'rollup'
import replace from '..'

test('replaces strings', assert => rollup({
  entry: 'fixtures/simple.js',
  plugins: [
    replace({
      patterns: [
        {
          test: 'process.env.NODE_ENV',
          replace: "'production'"
        },
        {
          test: /,\s*\)/g,
          replace: ')'
        },
        {
          test: /!(\w+)!/g,
          replace: function (_, words) {
            return words.toLowerCase()
          }
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf("'production' === 'production'") !== -1)
  assert.true(code.indexOf(', )') === -1)
  assert.true(!!~~code.indexOf('helloworld'))
}))

test('replaces with text', assert => rollup({
  entry: 'fixtures/simple.js',
  plugins: [
    replace({
      patterns: [
        {
          text: `exports = 'xxx'`
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf('xxx') !== -1)
}))

test('replaces with file', assert => rollup({
  entry: 'fixtures/simple.js',
  plugins: [
    replace({
      patterns: [
        {
          file: 'file.js'
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf('fileContent') !== -1)
}))

test('replaces with file', assert => rollup({
  entry: 'fixtures/simple.js',
  plugins: [
    replace({
      patterns: [
        {
          file: './file.js',
          transform (code) {
            return code + `\ndebugger;`
          }
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf('fileContent') !== -1)
  assert.true(code.indexOf('debugger;') !== -1)
}))
