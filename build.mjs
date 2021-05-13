// Invoke this file to build the app using esbuild
import esbuild from 'esbuild'
import rimraf from 'rimraf'

const mode = process.env.NODE_ENV || 'production'
const outdir = 'dist/'

try {
    // Environmental variables
    const define = {}

    // Override the service URL
    // This is used in development because the Bot Framework Emulator is running on localhost, but the Worker is running on the Cloudflare network, so it can't connect to "localhost"
    if (process.env.SERVICE_URL_OVERRIDE) {
        // Value must be quoted because it's a string
        define['SERVICE_URL_OVERRIDE'] = `'` + process.env.SERVICE_URL_OVERRIDE + `'`
    } else {
        define['SERVICE_URL_OVERRIDE'] = null
    }

    /** @type esbuild.BuildOptions */
    const esbuildOpts = {
        entryPoints: ['src/index.ts'],
        outfile: outdir + 'worker.js',
        bundle: true,
        platform: 'browser',
        target: 'es2020',
        charset: 'utf8',
        color: true,
        format: 'iife',
        mainFields: ['browser', 'module', 'main'],
        define,
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
} catch (err) {
    process.exit(1)
}
