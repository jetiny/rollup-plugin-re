import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'

export default function replace (options = {}) {
	const filter = createFilter(options.include, options.exclude)
	const patterns = options.patterns

 	if (Array.isArray(patterns)) {
		patterns.forEach((it)=>{
			if (Object.prototype.toString.call(it.test) === '[object RegExp]') {
				it.isRegexp = true
			}
			else if (typeof it === 'string') {
				it.isString = true
			}
		})
	}

	return {
	    name: 're',
	    load (id) {
	    	// preload
	    	return null
	    },
	    transform (code, id) {
	      	if (!filter(id)) {
	        	return
	      	}
	      	if (!patterns) {
	      		return
	      	}
			let hasReplacements = false
			const magicString = new MagicString( code )

			patterns.forEach((pattern) => {
				if (pattern.isRegexp) {
					while ( match = pattern.test.exec( code ) ) {
						hasReplacements = true
						start = match.index
						end = start + match[0].length
						replacement = pattern.replace.call(null, match)
						magicString.overwrite( start, end, replacement )
					}
				}
				else if(pattern.isString){
					let pos = code.indexOf(pattern.test),
						len = pattern.test.length
					while (pos != -1) {
						hasReplacements = true
						start = pos
						end = start + len
						magicString.overwrite( start, end, pattern.replace )
						pos = code.indexOf(pattern.test)
					}
				}
			})

			if ( !hasReplacements ) {
				return null
			}
			let result = { code: magicString.toString() }
			if ( options.sourceMap !== false ) {
				result.map = magicString.generateMap({ hires: true })
			}
	      	return result
	    }
  	}
}
