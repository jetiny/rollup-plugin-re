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
        },
        {
          test: /swap\((\w+), (\w+)\)/g,
          replace: '$2, $1'
        }
      ]
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf("'production' === 'production'") !== -1)
  assert.true(code.indexOf(', )') === -1)
  assert.true(!!~~code.indexOf('helloworld'))
  assert.true(code.indexOf('console.log(b, a)') !== -1)
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

test('defines', assert => rollup({
  entry: 'fixtures/define.js',
  plugins: [
    replace({
      defines: {
        IS_HELLO: true,
        IS_BYE: false
      }
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf('!Skip!') !== -1)
  assert.true(code.indexOf('!Skip2!') !== -1)
  assert.true(code.indexOf('!HelloWorld!') !== -1)
  assert.true(code.indexOf('!HelloWorld2!') !== -1)
  assert.true(code.indexOf('!GoodBye!') === -1)
  assert.true(code.indexOf('!GoodBye2!') === -1)
}))

test('replaces', assert => rollup({
  entry: 'fixtures/define.js',
  plugins: [
    replace({
      replaces: {
        IS_SKIP: 'IS_NO_SKIP',
        IS_BYE: 'IS_NO_BYE'
      }
    })
  ]
}).then((bundle) => {
  const code = bundle.generate().code
  assert.true(code.indexOf('IS_NO_SKIP') !== -1)
  assert.true(code.indexOf('IS_NO_BYE') !== -1)
  assert.true(code.indexOf('IS_SKIP') === -1)
  assert.true(code.indexOf('IS_BYE') === -1)
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

test('verbose', assert => {
  let ids = []
  return rollup({
    entry: 'fixtures/simple.js',
    plugins: [
      replace({
        verbose (it) {
          ids.push(it)
        }
      })
    ]
  }).then((bundle) => {
    assert.true(ids.length === 1)
  })
})

