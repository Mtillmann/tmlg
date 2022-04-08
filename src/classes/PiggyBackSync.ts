import type {LocalStorage} from "@/classes/LocalStorage";
import type {FsStorage} from "@/classes/FsStorage";


//@ts-ignore
let FETCH = 'fetch' in globalThis ? fetch : require('isomorphic-fetch');

export class PiggyBackSync {
    syncId: string = "";
    password: string = "";
    server: string = "";
    hasCredentials: boolean = false;
    lastUpdated: Date | null = null;
    storage: LocalStorage | FsStorage;

    serverList = [
        {
            url: 'https://api.xbrowsersync.org',
            location: 'United Kingdom',
            storage: '1MB'
        }, {
            url: 'https://xbrowsersync.freerangecloud.com',
            location: 'Canada',
            storage: '9.77MB'
        }, {
            url: 'https://sync.adminforge.de',
            location: 'Germany',
            storage: '4.88MB'
        }, {
            url: 'https://xbrowsersync.servicesforfree.com',
            location: 'Germany',
            storage: '20MB'
        }, {
            url: 'https://xbs.eris.cc',
            location: 'Germany',
            storage: '5MB'
        }, {
            url: 'https://xbsapi.cgrx.de',
            location: 'Germany',
            storage: '9.77MB'
        }, {
            url: 'https://xsync.nixnet.services',
            location: 'Germany',
            storage: '10MB'
        }, {
            url: 'https://xbs.25mb.co.uk', location: 'United Kingdom', storage: '1MB'
        }, {
            url: 'https://xbs.andrewkdinh.com', location: 'United States', storage: '1MB'
        }
    ];

    getCryptoImpl() {
        return window.crypto.subtle;
    }

    getRandomValues(input: Uint8Array): Uint8Array {
        return window.crypto.getRandomValues(input);
    }

    constructor(storage: LocalStorage | FsStorage) {
        this.storage = storage;
        const storedCredentials = this.storage.get("credentials");
        if (storedCredentials) {
            this.syncId = storedCredentials.syncId;
            this.password = storedCredentials.password;
            this.server = storedCredentials.server;
            this.hasCredentials = true;
        }

        const lastUpdated = this.storage.get("lastUpdated");
        if (lastUpdated) {
            this.lastUpdated = new Date(lastUpdated);
        }
    }

    generateNewSyncId(server: string): {} {
        server = server.replace(/\/+$/, "");
        return FETCH(server + "/bookmarks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({version: "1.1.13"}),
        }).then((r: any) => r.json());
    }

    setCredentials(
        server: string,
        syncId: string,
        password: string,
        store: boolean
    ): void {
        this.server = server.replace(/\/+$/, "");
        this.syncId = syncId;
        this.password = password;
        this.hasCredentials = true;
        if (store) {
            this.storeCredentials();
        }
    }

    forgetCredentials(): void {
        this.password = "";
        this.server = "";
        this.syncId = "";
        this.storage.remove("credentials");
        this.hasCredentials = false;
    }

    getCredentials(): { [index: string]: string } {
        return {
            password: this.password,
            server: this.server,
            syncId: this.syncId
        }

    }

    async getLastUpdated(setLastUpdated = true): Promise<any> {
        return FETCH(`${this.server}/bookmarks/${this.syncId}/lastUpdated`, {
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((r: any) => r.json())
            .then((json: any) => {
                if (json.message) {
                    //assume it has failed...
                    return {
                        error: true,
                        message: json.message,
                    };
                }

                const lastUpdated = new Date(json.lastUpdated);
                if (setLastUpdated) {
                    this.setLastUpdated(lastUpdated);
                }
                return lastUpdated;
            });
    }

    setLastUpdated(date: Date): void {
        this.lastUpdated = date;
        this.storage.set("lastUpdated", this.lastUpdated.toISOString());
    }

    storeCredentials(): void {
        this.storage.set("credentials", {
            syncId: this.syncId,
            password: this.password,
            server: this.server,
        });
    }

    async needsUpdate(): Promise<boolean> {
        return this.getLastUpdated(false).then((resp) => {
            if ("error" in resp) {
                throw new Error(resp.message);
            }
            return +this.lastUpdated! !== +resp;
        });
    }

    async load(): Promise<{}> {
        const data = await FETCH(`${this.server}/bookmarks/${this.syncId}`, {
            headers: {
                "Content-Type": "application/json",
            },
        }).then((r: any) => r.json());

        if (!("bookmarks" in data)) {
            return false;
        }

        if ("lastUpdated" in data) {
            this.setLastUpdated(new Date(data.lastUpdated));
        }

        const decrypted = await this.decryptData(
            data.bookmarks,
            this.password,
            false
        );

        let decompressed = await this.decompress(decrypted);

        return JSON.parse(decompressed);
    }

    /**
     *
     * @api
     * @param data
     * @returns {Promise<void>}
     */
    async store(data: {}): Promise<any | null> {
        const string = JSON.stringify(data);

        if (this.hasCredentials) {
            const compressed = await this.compress(string),
                compressedEncrypted = await this.encryptData(compressed, this.password);

            return FETCH(this.server + "/bookmarks/" + this.syncId, {
                method: "PUT",
                //new Headers(,,,) not working with polyfill thing
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookmarks: compressedEncrypted, //lastUpdated: (new Date()).toISOString()
                }),
            })
                .then((resp: any) => resp.json())
                .then((json: any) => {
                    if ("message" in json) {
                        //... wtf?
                        console.log("whaty fucky");
                        return;
                    }

                    this.setLastUpdated(new Date(json.lastUpdated));

                    return {
                        original: string.length,
                        compressed: compressed.byteLength,
                        // @ts-ignore
                        encrypted: compressedEncrypted.length,
                    };
                });
        }

        return null;
    }

    async compress(string: string, encoding = "deflate"): Promise<ArrayBuffer> {
        const byteArray = new TextEncoder().encode(string),
            // @ts-ignore
            cs = new CompressionStream(encoding),
            writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();
        return new Response(cs.readable).arrayBuffer();
    }

    async decompress(
        byteArray: string | ArrayBuffer,
        encoding = "deflate"
    ): Promise<string> {
        // @ts-ignore
        const ds = new DecompressionStream('deflate'),
            writer = ds.writable.getWriter();

        writer.write(byteArray);
        writer.close();
        return new Response(ds.readable).arrayBuffer().then(function (arrayBuffer) {

            return new TextDecoder().decode(arrayBuffer);
        });
    }

    //♥♥♥♥♥ https://bradyjoslin.com/blog/encryption-webcrypto/#supplemental-resources
    buff_to_base64(buff: ArrayBuffer): string {
        // @ts-ignore
        return btoa(String.fromCharCode.apply(null, buff));
    }

    base64_to_buf(b64: string): Uint8Array {
        // @ts-ignore
        return Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));
    }

    getPasswordKey(password: string): Promise<CryptoKey> {
        return this.getCryptoImpl().importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveKey"]
        );
    }

    deriveKey(
        passwordKey: CryptoKey,
        salt: BufferSource,
        keyUsage: Array<KeyUsage>
    ): Promise<CryptoKey> {

        return this.getCryptoImpl().deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 250000,
                hash: "SHA-256",
            },
            passwordKey,
            {name: "AES-GCM", length: 256},
            false,
            keyUsage
        );
    }

    async encryptData(
        secretData: string | ArrayBuffer,
        password: string
    ): Promise<ArrayBuffer | string> {
        try {
            const salt = this.getRandomValues(new Uint8Array(16));
            const iv = this.getRandomValues(new Uint8Array(12));
            const passwordKey = await this.getPasswordKey(password);
            const aesKey = await this.deriveKey(passwordKey, salt, ["encrypt"]);
            const encryptedContent = await this.getCryptoImpl().encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                aesKey,
                typeof secretData === "string"
                    ? new TextEncoder().encode(secretData)
                    : secretData
            );

            const encryptedContentArr = new Uint8Array(encryptedContent);
            const buff = new Uint8Array(
                salt.byteLength + iv.byteLength + encryptedContentArr.byteLength
            );
            buff.set(salt, 0);
            buff.set(iv, salt.byteLength);
            buff.set(encryptedContentArr, salt.byteLength + iv.byteLength);
            return this.buff_to_base64(buff);
        } catch (e) {
            console.log(`Error - ${e}`);
            return "";
        }
    }

    async decryptData(
        encryptedData: string,
        password: string,
        decode = true
    ): Promise<ArrayBuffer | string> {
        try {
            const encryptedDataBuff = this.base64_to_buf(encryptedData);
            const salt = encryptedDataBuff.slice(0, 16);
            const iv = encryptedDataBuff.slice(16, 16 + 12);
            const data = encryptedDataBuff.slice(16 + 12);
            const passwordKey = await this.getPasswordKey(password);
            const aesKey = await this.deriveKey(passwordKey, salt, ["decrypt"]);
            const decryptedContent = await this.getCryptoImpl().decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                aesKey,
                data
            );
            return decode
                ? new TextDecoder().decode(decryptedContent)
                : decryptedContent;
        } catch (e) {
            console.log(`Error - ${e}`);
            return "";
        }
    }

    async createConnectionStrings(urlToUse: string | boolean, includePassword: boolean = false): Promise<{ [index: string]: string }> {

        let connectionStrings: { [index: string]: string } = {
            cli: `tmlg --sync-setup --sync-enable --sync-server "${this.server}" --sync-id "${this.syncId}" --sync`
        }

        if (includePassword) {
            connectionStrings.cli += ` --sync-password "${this.password}"`;
        }

        if (urlToUse && typeof urlToUse === 'string') {


            connectionStrings.url = await this.encryptData(JSON.stringify({
                syncId: this.syncId, server: this.server
            }), this.password).then(encrypted => {
                const url = new URL(urlToUse);
                // @ts-ignore
                url.searchParams.set('encryptedSyncCredentials', encrypted);

                if (includePassword) {
                    url.searchParams.set('password', btoa(this.password));
                }

                return url.toString();
            });
        }

        return connectionStrings;
    }

}
