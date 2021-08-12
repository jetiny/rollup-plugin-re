import type { Plugin } from 'rollup';

declare module 'rollup-plugin-re' {
  interface ReplacementPattern {
    /**
     * Files to include
     */
     include?: string | string[];

     /**
      * Files to exclude
      */
     exclude?: string | string[];

     /**
      * File path match RegExp
      */
     match: RegExp;

     /**
      * Source file match to replace
      */
     test: string | RegExp;

     /**
      * What to replace with
      */
    replace: string | (() => string);
  }

  interface Options {
    /**
     * Files to include
     */
    include?: string | string[];

    /**
     * Files to exclude
     */
    exclude?: string | string[];

    /**
     * Map of macros to remove (true) or keep (false)
     */
    defines?: Record<string, boolean>,

    /**
     * Direct text replacement map of input to output
     */
    replaces?: Record<string, string>,

    /**
     * Replacement patterns
     */
    patterns?: ReplacementPattern[];
  }

  export default function (options: Options): Plugin;
}
