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
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf("'production' === 'production'") !== -1)
}))
