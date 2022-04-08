export class DateTimeHelper {


    dateRegExpCache: { [index: string]: any } = {};
    internalFormat: string = 'yyyy-mm-dd';

    lzp(int: number): string {
        return ("0" + int).slice(-2);
    }

    formatRange(from: Date | number, to: Date | number, format: string): string {
        from = from instanceof Date ? from : new Date(from);
        to = to instanceof Date ? to : new Date(to);

        const fromDate: string = this.lzp(from.getDate()),
            fromMonth: string = this.lzp(from.getMonth() + 1),
            fromYear: string = String(from.getFullYear()),
            toDate: string = this.lzp(to.getDate()),
            toMonth: string = this.lzp(to.getMonth() + 1),
            toYear: string = String(to.getFullYear()),
            useFromYear: boolean = fromYear !== toYear,
            useFromMonth: boolean = fromMonth !== toMonth,
            fromMonthOptional: boolean = format.indexOf('mm?') > -1,
            fromYearOptional: boolean = format.indexOf('yyyy?') > -1;

        let output = format.replace('dd', fromDate);

        output = output
            .replace(/mm\??/, fromMonthOptional ? (useFromMonth ? fromMonth : '') : fromMonth)
            .replace(/yyyy\??/, fromYearOptional ? (useFromYear ? fromYear : '') : fromYear);

        output = output.replace('dd', toDate).replace('mm', toMonth).replace('yyyy', toYear);

        return output.replace(/^[^\d]+/, '')
            .replace(/([^\d])\1+/g, '$1');
    }

    convertFormattedString(date: string, fromFormat: string, toFormat: string): string {
        return this.formatDate(this.dateFromFormattedString(date, fromFormat), toFormat)
    }

    findFormattedDateInString(string: string, format: string) {
        const matches = string.match(this.formatRegExps(format).formatMatchRegExp);

        if (matches && matches.length >= 2) {
            return matches[0];
        }
    }

    convertFormattedDateInString(string: string, fromFormat: string, toFormat: string) {
        const foundDate = this.findFormattedDateInString(string, fromFormat);
        if (foundDate) {
            return string.replace(
                foundDate,
                this.formatDate(
                    this.dateFromFormattedString(foundDate, fromFormat),
                    toFormat
                )
            );
        }

        return string;
    }

    formatDate(date: Date | number, format: string = 'yyyy-mm-dd'): string {

        date = date instanceof Date ? date : new Date(date);

        let parts: { [index: string]: string } = {
            dd: this.lzp(date.getDate()),
            d: String(date.getDate()),
            mm: this.lzp(date.getMonth() + 1),
            m: String(date.getMonth() + 1),
            yyyy: String(date.getFullYear()),
            yy: String(parseInt(String(date.getFullYear()).slice(-2)))
        }

        for (const key in parts) {
            const re = new RegExp(`\\b${key}\\b`);
            format = format.replace(re, parts[key]);
        }

        return format;
    }

    //♥♥♥ https://stackoverflow.com/a/6969486/8797350
    escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|\/[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    findDateInString(string: string): RegExpMatchArray | null {
        return string.match(this.formatRegExps().dateMatchRegExp);
    }

    formatRegExps(format?: string): { [index: string]: any } {

        if (!format) {
            format = this.internalFormat;
        }

        if (format in this.dateRegExpCache) {
            return this.dateRegExpCache[format];
        }

        let nonNumericCharacters: string = this.escapeRegExp([...new Set(format.replace(/\w/g, '').split(''))].join(''));
        let dateMatchRegExp: RegExp = new RegExp(`(?<![+:\\d]|[\\/@%#]\\w+)(:([-|+]?[\\w\\d${nonNumericCharacters}]{1,10}))`);

        let actualDateMatchRegExp: RegExp = new RegExp('^' + this.escapeRegExp(format)
                .replace(/dd?/, '(\\d\\d?)')
                .replace(/mm?/, '(\\d\\d?)')
                .replace(new RegExp(`(${nonNumericCharacters})(y{2,4})`), '$1?$2')
                .replace(new RegExp(`(y{2,4})(${nonNumericCharacters})`), '$1$2?')
                .replace(/y{2,4}/, '(\\d{4})?') + '$'),
            formatMatchRegExp: RegExp = new RegExp('(' + this.escapeRegExp(format)
                .replace(/dd?/, '\\d\\d?')
                .replace(/mm?/, '\\d\\d?')
                .replace(new RegExp(`(${nonNumericCharacters})(y{2,4})`), '$1?$2')
                .replace(new RegExp(`(y{2,4})(${nonNumericCharacters})`), '$1$2?')
                .replace(/y{2,4}/, '(\\d{4})?') + ')')

        let indexes: ([string, number])[] = [
            ['d', format.indexOf('d')],
            ['m', format.indexOf('m')],
            ['y', format.indexOf('y')]
        ];

        indexes.sort((a: [string, number], b: [string, number]) => a[1] - b[1]);
        indexes = indexes.map((item, index) => [item[0], index]);

        this.dateRegExpCache[format] = {
            formatMatchRegExp,
            dateMatchRegExp,
            actualDateMatchRegExp,
            indexes: indexes.reduce((indexObj: { [index: string]: any }, item: any) => {
                indexObj[item[0]] = item[1];
                return indexObj;
            }, {})
        };

        return this.dateRegExpCache[format];
    }

    dateFromFormattedString(input: string, format: string): Date {
        let regexps: { [index: string]: any } = this.formatRegExps(format || this.internalFormat),
            matches: RegExpMatchArray | null = input.match(regexps.actualDateMatchRegExp);

        if (matches) {
            let y: number = Number(matches[regexps.indexes.y + 1] || (new Date()).getFullYear()),
                m: number = Number(matches[regexps.indexes.m + 1]) - 1,
                d: number = Number(matches[regexps.indexes.d + 1]);

            return new Date(y, m, d);
        }
        return new Date();
    }


    parseDuration(str: string, defaultDuration: number, hourThreshold: number): number {
        if (str.slice(0, 1) === '+') {
            str = str.slice(1);
        }
        if (/^\d\d?\d?$/.test(str)) {
            const int: number = parseInt(str);
            if (int <= hourThreshold) {
                return int * 60;
            }
            return int;
        }

        if (/\d{0,2}:\d{1,2}/.test(str)) {

            // @ts-ignore
            let [h, m]: [string | number, string | number] = str.split(':');

            h = h ? parseInt(h) : 0;
            m = m ? parseInt(m) : 0;

            return h * 60 + m;
        }

        if (/\d{0,2}\.\d{1,2}/.test(str)) {
            // @ts-ignore
            let [h, m]: [string | number, string | number] = str.split('.'),
                mHasLeadingZero: boolean = m.slice(0, 1) === '0';

            h = h ? parseInt(h) : 0;
            m = m ? parseInt(m) : 0;

            if (m < 10 && !mHasLeadingZero) {
                m = m * 10;
            }

            m = m / 100;

            return h * 60 + Math.round(60 * m);
        }

        return defaultDuration;

    };

    parseDate(str?: string, format?: string): Date {
        str = String(str);
        if (str.slice(0, 1) === ':') {
            str = str.slice(1);
        }

        const msecPerDay = 86400000,
            shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
            shortDayRe = new RegExp(`^(last|next)?(${shortDays.join('|')})$`),
            now = new Date();

        str = !str ? '' : String(str).trim();

        let date: Date;

        if (['y', 'yesterday'].indexOf(str) > -1) {
            str = '-1';
        }

        if (shortDayRe.test(str)) {
            const today: number = now.getDay(),
                target: number = shortDays.indexOf(str.slice(-3)),
                prefix: string = str.slice(0, 4),
                add: number = prefix === 'last' ? -7 : prefix === 'next' ? 7 : 0,
                result: number = target - today + add;

            if (result > -1) {
                str = '+' + result;
            } else {
                str = String(result);
            }
        }


        if (/^[-|+]\d+$/.test(str)) {
            date = new Date(Date.now() + parseInt(str) * msecPerDay);
        } else if (format && this.formatRegExps(format).actualDateMatchRegExp.test(str)) {
            date = this.dateFromFormattedString(str, format);
        } else {
            date = now;
        }

        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);


        return date;
    }

}