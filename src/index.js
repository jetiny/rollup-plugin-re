import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'
import {resolve} from 'path'
import fs from 'fs'

/*
  {
    defines: {
      IS_MOCK: true,
    }
  }
 */
function parseDefines (defines, patterns) {
  if (isObject(defines)) {
    for (let defineName in defines) {
      if (!defines[defineName]) { // remove define blocks
        patterns.push({
          test: makeDefineRegexp(defineName),
          replace: ''
        })
      }
    }
  }
}

/*
  {
    replaces: {
      Host: `'localhost'`,        // replace
    }
  }
*/
function parseReplaces (replaces, patterns) {
  if (isObject(replaces)) {
    for (let replaceName in replaces) {
      patterns.push({
        test: replaceName,
        replace: replaces[replaceName]
      })
    }
  }
}

/*
  {
    patterns: [
      {
        include: 'String|Regexp',
        exclude: 'String|Regexp',
        match: 'String|Regexp|Function',

        test: 'String|RegExp',

        replace: 'String|Function',
        file: 'String',
        text: 'String',

        transform: 'Function'
      }
    ]
  }
*/
function parsePatterns (patterns, contents) {
  patterns.forEach((it) => {
    if (it._pass) {
      return contents.push(it)
    }
    // filter
    it.filter = createFilter(it.include, it.exclude)

    // match
    if (isFunction(it.match)) {
      it.matcher = it.match
    } else if (isRegExp(it.match)) {
      it.matcher = it.match.test.bind(it.match)
    } else if (isString(it.match)) {
      it.matcher = createFilter(it.match)
    }
    // test
    if (isRegExp(it.test)) {
      it.testIsRegexp = true
    } else if (isString(it.test)) {
      it.testIsString = true
    }
    // replace
    if (isString(it.replace)) {
      it.replaceIsString = true
    } else if (isFunction(it.replace)) {
      it.replaceIsFunction = true
    }
    // content by file
    if (isString(it.file)) {
      it.replaceContent = (res) => {
        let file = resolve(res.id, '../', it.file)
        try {
          res.content = fs.readFileSync(file).toString()
        } catch (err) {
          throw new Error('[rollup-plugin-re] can not readFile: ' + file)
        }
      }
    }
    // text
    if (isString(it.text)) {
      it.replaceContent = (res) => {
        res.content = it.text
      }
    }
    contents.push(it)
  })
}

function verbose (opts, result, id) {
  if (opts.verbose) {
    if (isFunction(opts.verbose)) {
      opts.verbose(result, id)
    } else {
      console.log(`[${result}]`, id)
    }
  }
}

export default function replace (options = {}) {
  const filter = createFilter(options.include, options.exclude)
  let contents = []
  let patterns = options.patterns || (options.patterns = [])
  parseDefines(options.defines, patterns)
  parseReplaces(options.replaces, patterns)
  parsePatterns(patterns, contents)
  return {
    name: 're',
    transform (code, id) {
      if (!filter(id)) {
        verbose(options, 'exclude', id)
        return
      }
      if (!contents.length) {
        verbose(options, 'ignore', id)
        return
      }
      let hasReplacements = false
      let magicString = new MagicString(code)
      contents.forEach((pattern) => {
        if (!pattern.filter(id)) {
          return
        }
        if (pattern.matcher && !pattern.matcher(id)) {
          return
        }
        // replace content
        if (pattern.replaceContent) {
          let res = {
            id,
            code,
            magicString
          }
          pattern.replaceContent(res)
          if (isString(res.content) && res.content !== code) {
            hasReplacements = true
            magicString = new MagicString(res.content)
            code = res.content
          }
        }
        // transform
        if (isFunction(pattern.transform)) {
          let newCode = pattern.transform(code, id)
          if (isString(newCode) && newCode !== code) {
            hasReplacements = true
            magicString = new MagicString(newCode)
            code = newCode
          }
        }
        // test & replace
        if (pattern.testIsRegexp) {
          let match = pattern.test.exec(code)
          let start, end
          while (match) {
            hasReplacements = true
            start = match.index
            end = start + match[0].length
            let str
            if (pattern.replaceIsString) {
              // fill capture groups
              str = pattern.replace.replace(/\$\$|\$&|\$`|\$'|\$\d+/g, m => {
                if (m === '$$') {
                  return '$'
                }
                if (m === '$&') {
                  return match[0]
                }
                if (m === '$`') {
                  return code.slice(0, start)
                }
                if (m === "$'") {
                  return code.slice(end)
                }
                const n = +m.slice(1)
                if (n >= 1 && n < match.length) {
                  return match[n] || ''
                }
                return m
              })
            } else {
              str = pattern.replace.apply(null, match)
            }
            if (!isString(str)) {
              throw new Error('[rollup-plugin-re] replace function should return a string')
            }
            magicString.overwrite(start, end, str)
            match = pattern.test.global ? pattern.test.exec(code) : null
          }
        } else if (pattern.testIsString) {
          let start, end
          let len = pattern.test.length
          let pos = code.indexOf(pattern.test)
          while (pos !== -1) {
            hasReplacements = true
            start = pos
            end = start + len
            if (pattern.replaceIsString) {
              magicString.overwrite(start, end, pattern.replace)
            } else if (pattern.replaceIsFunction) {
              let str = pattern.replace(id)
              if (!isString(str)) {
                throw new Error('[rollup-plugin-re] replace function should return a string')
              }
              magicString.overwrite(start, end, str)
            }
            pos = code.indexOf(pattern.test, pos + 1)
          }
        }
      })

      if (!hasReplacements) {
        return
      }
      verbose(options, 'replace', id)
      let result = { code: magicString.toString() }
      if (options.sourceMap !== false) {
        result.map = magicString.generateMap({ hires: true })
      }
      return result
    }
  }
}

let source = /\/\/\s#if\sIS_DEFINE(.*)([\s\S]*?)\/\/\s#endif/g.source

function makeDefineRegexp (text) {
  return new RegExp(source.replace('IS_DEFINE', text), 'g')
}

function isRegExp (re) {
  return Object.prototype.toString.call(re) === '[object RegExp]'
}

function isString (str) {
  return typeof str === 'string'
}

function isFunction (val) {
  return typeof val === 'function'
}

function isObject (val) {
  return val !== null && Object.prototype.toString.call(val) === '[object Object]'
}
