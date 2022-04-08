import {PiggyBackSync} from "@/classes/PiggyBackSync";

const crypto = require('crypto');
const {subtle} = require('crypto').webcrypto;
const zlib = require('zlib');

export class NodePiggybackSync extends PiggyBackSync {
    getCryptoImpl(): any {
        return subtle;
    }

    getRandomValues(input:Uint8Array):Uint8Array{
        return Uint8Array.from(crypto.randomBytes(input.byteLength))
    }

    async compress(string: string, encoding = "deflate"): Promise<ArrayBuffer> {
        const deflateBuffer = zlib.deflateSync(Buffer.from(string));

        return new Promise((resolve, reject) => {
            resolve(deflateBuffer);
        })
    }

    async decompress(
        byteArray: string | ArrayBuffer,
        encoding = "deflate"
    ): Promise<string> {
        const inflateBuffer = zlib.inflateSync(typeof byteArray === 'string' ? byteArray : Buffer.from(byteArray)),
            inflateString = inflateBuffer.toString();

        return new Promise((resolve, reject) => {
            resolve(inflateString);
        })
    }

}
