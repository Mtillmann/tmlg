import {defineConfig} from "vite";
import {fileURLToPath, URL} from "url";

const path = require('path')
export default defineConfig({
    publicDir: false,
    build: {
        target : 'node16',
        outDir: 'bin',
        lib: {
            entry: path.resolve(__dirname, 'src/cli.ts'),
            name: 'TMLG',
            formats : ['es'],
            fileName: 'tmlg'
        },
        rollupOptions : {
            output : {
                banner : '#!/usr/bin/env node'
            }
        }

    },
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },

});
