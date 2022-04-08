export class LocalStorage {

    set(key: string, input: any): void {
        if (typeof input !== "string") {
            input = JSON.stringify(input);
        }

        window.localStorage.setItem(key, input);
    }

    get(key: string, defaultValue: any = false): any {
        const found = window.localStorage.getItem(key);
        if (found && ['"', "{", "["].indexOf(found[0]) > -1) {
            return JSON.parse(found);
        }
        return found || defaultValue;
    }

    remove(key: string): boolean {
        window.localStorage.removeItem(key);

        return true;
    }
}
