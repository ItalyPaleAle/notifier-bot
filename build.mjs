// Invoke this file to build the app using esbuild
import esbuild from 'esbuild'
import rimraf from 'rimraf'

const mode = process.env.NODE_ENV || 'production'
const outdir = 'dist/'

try {
    /** @type esbuild.BuildOptions */
    const esbuildOpts = {
        entryPoints: ['src/index.ts'],
        outfile: outdir + 'worker.js',
        bundle: true,
        platform: 'browser',
        target: 'es2020',
        charset: 'utf8',
        color: true,
        // Use format esm so there's no IIFE and code is attached together "as-is"
        // This is fine for the Cloudflare Workers environment
        format: 'esm',
    }
    if (mode == 'production') {
        // In production mode, minify the output and enable sourcemaps
        esbuildOpts.minify = true
        esbuildOpts.sourcemap = true
    }

    // Clean the output directory
    rimraf.sync(outdir)

    // Build with esbuild
    await esbuild.build(esbuildOpts)
}
catch (err) {
    process.exit(1)
}
