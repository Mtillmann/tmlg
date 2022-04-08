import {DateTimeHelper} from "@/classes/DateTimeHelper";

export class Util {

    dateTimeHelper: DateTimeHelper;

    constructor() {
        this.dateTimeHelper = new DateTimeHelper();
    }

    defaultDates(){
        const defaultDateFormat = (new Date(2022, 11, 29)).toLocaleDateString()
                .replace('2022', 'yyyy')
                .replace('22', 'yy')
                .replace('12', 'mm')
                .replace('29', 'dd'),
            defaultDateRangeFormat = defaultDateFormat.replace('yyyy','yyyy?')
                .replace('mm','mm?') + ' - ' + defaultDateFormat;

        return {defaultDateFormat, defaultDateRangeFormat};
    }

    join(array: string[], prefix: string = '', alternative = "n/a"): string {
        if (array.length === 0) {
            return alternative;
        }
        return (prefix + array.join(", " + prefix)).trim();
    }

    copyToClipboard(text: string, sourceElement: HTMLElement): void {
        const textarea = document.createElement("textarea");
        textarea.classList.add(
            "position-absolute",
            "opacity-0",
            "start-0",
            "top-0"
        );

        sourceElement.insertAdjacentElement("afterend", textarea);
        textarea.value = text;
        textarea.focus();
        textarea.select();

        // noinspection JSDeprecatedSymbols
        document.execCommand("copy");
        textarea.blur();
        textarea.remove();
    }

    //♥♥♥ https://stackoverflow.com/a/6969486/8797350
    escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    round(float: number, precision = 2): number {
        return (
            Math.round(float * Math.pow(10, precision)) / Math.pow(10, precision)
        );
    }

    formatDateRangeByFormat(from: Date | number, to: Date | number, format: string): string {
        return this.dateTimeHelper.formatRange(from, to, format);
    }

    formatDate(date: Date | number, format: string = 'yyyy-mm-dd'): string {
        return this.dateTimeHelper.formatDate(date, format);
    }

    floatHoursFromMinutes(minutes: number): number {
        const h: number = Math.floor(minutes / 60),
            m: number = (minutes - h * 60) / 60;

        return h + m;
    }

    formatDuration(minutes: number): string {
        const h: number = Math.floor(minutes / 60),
            m: number = minutes - h * 60;

        return `${h}:${("0" + m).slice(-2)}`;
    }

    costFromRate(minutes: number, rate: number): number {
        return this.floatHoursFromMinutes(minutes) * rate;
    }

    formatAmount(float: number, currencyFormat: string): string {
        const number = new Intl.NumberFormat(undefined, {style: 'currency', currency: 'USD'}).format(float)
            .replace(/\s.*$/, '').replace(/[^\d.',-]/g, '');

        return currencyFormat.replace('%s', number);
    }

    formatCost(cost: number, currencyFormat: string, tax: number = 0, taxIncluded: boolean = false): string {
        if (tax === 0) {
            return this.formatAmount(this.round(cost), currencyFormat);
        }

        let taxAmount: number;

        const taxFactor: number = tax * 0.01;
        if (taxIncluded) {
            taxAmount = cost - cost / (1 + taxFactor);
        } else {
            taxAmount = cost * taxFactor;
            cost += taxAmount;
        }

        const formatted: string = this.formatAmount(this.round(cost), currencyFormat);

        const taxAmountFormatted: string = this.formatAmount(this.round(taxAmount), currencyFormat);

        return `${formatted} <small>(incl ${taxAmountFormatted} tax)</small>`;
    }

    formatBytes(bytes: number, decimals = 2): string {
        if (bytes === 0) return "0 Bytes";

        const k: number = 1024;
        const dm: number = decimals < 0 ? 0 : decimals;
        const sizes: string[] = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

        const i: number = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

    hash(bytes: number): string {

        if (globalThis.crypto && 'getRandomValues' in globalThis.crypto) {

            return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)))
                .map((e) => ("0" + e.toString(16)).slice(-2))
                .join("");
        }
        else{
            return require('crypto').randomBytes(bytes).toString('hex');
        }
    }

    dateRange(mode: string, start: string): { [index: string]: any } {
        let [y, m, d] = start.split('-').map((str: string): number => parseInt(str)),
            now: Date = new Date(y, m - 1, d)


        now.setMilliseconds(0);

        let upper: Date,
            lower: Date = new Date(now),
            next: Date = new Date(now),
            prev: Date = new Date(now);

        if (mode === 'month') {
            lower.setDate(1);
            lower.setHours(0);
            lower.setMinutes(0);
            lower.setSeconds(0);

            upper = new Date(lower);
            upper.setMonth(lower.getMonth() + 1);
            upper.setSeconds(-1);

            next.setMonth(next.getMonth() + 1);
            prev.setMonth(prev.getMonth() - 1);
        } else {
            lower.setDate(lower.getDate() - lower.getDay() + 1)
            lower.setHours(0);
            lower.setMinutes(0);
            lower.setSeconds(0);

            upper = new Date(lower);
            upper.setDate(lower.getDate() + 7);
            upper.setSeconds(-1);

            next.setDate(next.getDate() + 7);
            prev.setDate(prev.getDate() - 7);

        }

        return {
            upper,
            lower,
            upperUS: this.formatDate(upper),
            lowerUS: this.formatDate(lower),
            next: `${next.getFullYear()}-${('0' + (next.getMonth() + 1)).slice(-2)}-${('0' + next.getDate()).slice(-2)}`,
            prev: `${prev.getFullYear()}-${('0' + (prev.getMonth() + 1)).slice(-2)}-${('0' + prev.getDate()).slice(-2)}`,
        }
    }

    escapeStringForFilename(string: string, replacement: string = '-'): string {
        [
            34, 60, 62, 124, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
            24, 25, 26, 27, 28, 29, 30, 31, 58, 42, 63, 92, 47
        ].forEach((charCode: number): void => {
            const char: string = String.fromCharCode(charCode);
            while (string.indexOf(char) > -1) {
                string = string.replace(char, replacement)
            }
        })

        return string;
    }
}