//@ts-ignore
const fs = require('fs');

export class FsStorage {

    set(key: string, input: any): void {
        if (typeof input !== "string") {
            input = JSON.stringify(input);
        }

        fs.writeFileSync(`DATA_${key}.json`, input);
    }

    get(key: string, defaultValue: any = false): any {

        let found = defaultValue;
        try {

            const raw = fs.readFileSync(`DATA_${key}.json`);
            found = JSON.parse(raw);
        } catch (e) {

        }

        return found;
    }

    remove(key: string): boolean {

        fs.unlinkSync(`DATA_${key}.json`);

        return true;
    }
}
