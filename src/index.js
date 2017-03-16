import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'

export default function replace (options = {}) {
  const filter = createFilter(options.include, options.exclude)
  let contents = []

  const patterns = options.patterns
  if (Array.isArray(patterns)) {
    patterns.forEach((it) => {
      if (Object.prototype.toString.call(it.test) === '[object RegExp]') {
        it.testIsRegexp = true
      } else if (typeof it.test === 'string') {
        it.testIsString = true
      }
      if (typeof it.replace === 'string') {
        it.replaceIsString = true
      } else if (typeof it.replace === 'function') {
        it.replaceIsFunction = true
      }
      it.filter = createFilter(it.include, it.exclude)
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
      const magicString = new MagicString(code)
      contents.forEach((pattern) => {
        if (!pattern.filter(id)) {
          return
        }
        if (pattern.match && !pattern.match.test(id)) {
          return
        }
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
              magicString.overwrite(start, end, pattern.replace.call(null, match))
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
              magicString.overwrite(start, end, pattern.replace())
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
