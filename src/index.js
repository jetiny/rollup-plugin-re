import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'
import {resolve} from 'path'
import fs from 'fs'

function isRegExp (re) {
  return Object.prototype.toString.call(re) === '[object RegExp]'
}

export default function replace (options = {}) {
  const filter = createFilter(options.include, options.exclude)
  let contents = []

  const patterns = options.patterns
  if (Array.isArray(patterns)) {
    patterns.forEach((it) => {
      if (it._pass) {
        return contents.push(it)
      }
      // filter
      it.filter = createFilter(it.include, it.exclude)
      // match
      if (typeof it.match === 'function') {
        it.matcher = it.match
      } else if (isRegExp(it.match)) {
        it.matcher = it.match.test.bind(it.match)
      } else if (typeof it.match === 'string') {
        it.matcher = createFilter(it.match)
      }
      // test
      if (isRegExp(it.test)) {
        it.testIsRegexp = true
      } else if (typeof it.test === 'string') {
        it.testIsString = true
      }
      // replace
      if (typeof it.replace === 'string') {
        it.replaceIsString = true
      } else if (typeof it.replace === 'function') {
        it.replaceIsFunction = true
      }
      // content by file
      if (typeof it.file === 'string') {
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
      if (typeof it.text === 'string') {
        it.replaceContent = (res) => {
          res.content = it.text
        }
      }
      contents.push(it)
    })
  }

  return {
    name: 're',
    transform (code, id) {
      if (!filter(id)) {
        return
      }
      if (!contents.length) {
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
          if (res.content && res.content !== code) {
            hasReplacements = true
            magicString = new MagicString(res.content)
            code = res.content
          }
        }
        // transform
        if (pattern.transform) {
          let newCode = pattern.transform(code, id)
          if (newCode !== code) {
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
            if (pattern.replaceIsString) {
              magicString.overwrite(start, end, pattern.replace)
            } else if (pattern.replaceIsFunction) {
              let str = pattern.replace.apply(null, match)
              if (typeof str !== 'string') {
                throw new Error('[rollup-plugin-re] replace function should return a string')
              }
              magicString.overwrite(start, end, str)
            }
            match = pattern.test.exec(code)
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
              let str = pattern.replace()
              if (typeof str !== 'string') {
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
      let result = { code: magicString.toString() }
      if (options.sourceMap !== false) {
        result.map = magicString.generateMap({ hires: true })
      }
      return result
    }
  }
}
