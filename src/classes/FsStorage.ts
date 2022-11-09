//@ts-ignore
const fs = require('fs');

export class FsStorage {

    dir:string;

    constructor() {

        const homedir = require('os').homedir(),
        dir = homedir + '/.tmlg-data';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {});
        }

        this.dir = dir + '/';
    }

    set(key: string, input: any): void {
        if (typeof input !== "string") {
            input = JSON.stringify(input);
        }

        fs.writeFileSync(`${this.dir}DATA_${key}.json`, input);
    }

    get(key: string, defaultValue: any = false): any {

        let found = defaultValue;
        try {

            const raw = fs.readFileSync(`${this.dir}DATA_${key}.json`);
            found = JSON.parse(raw);
        } catch (e) {

        }

        return found;
    }

    remove(key: string): boolean {

        fs.unlinkSync(`${this.dir}DATA_${key}.json`);

        return true;
    }
}
