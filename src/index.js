import { createFilter } from 'rollup-pluginutils'
import MagicString from 'magic-string'
import * as fs from 'fs'

function isFile ( file ) {
	try {
		const stats = fs.statSync( file );
		return stats.isFile();
	} catch ( err ) {
		return false;
	}
}

export default function replace (options = {}) {
	const filter = createFilter(options.include, options.exclude)
	let contents = []

	const patterns = options.patterns
 	if (Array.isArray(patterns)) {
		patterns.forEach((it)=>{
			if (Object.prototype.toString.call(it.test) === '[object RegExp]') {
				it.isRegexp = true
			}
			else if (typeof it.test === 'string') {
				it.isString = true
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
			let hasReplacements = false, start, end, replacement
			const magicString = new MagicString( code )
			contents.forEach((pattern) => {
				if (!pattern.filter(id)) {
					return
				}
				if (pattern.match) {
					if (!pattern.match.test(id)) {
						return
					}
				}
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
					while (pos !== -1) {
						hasReplacements = true
						start = pos
						end = start + len
						magicString.overwrite( start, end, pattern.replace )
						pos = code.indexOf(pattern.test, pos+1 )
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
