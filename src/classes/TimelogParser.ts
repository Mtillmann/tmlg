import {DateTimeHelper} from "@/classes/DateTimeHelper";
import type {ITimelog} from "@/types/ITimelog";
import type {IDecoratedTimelog} from "@/types/IDecoratedTimelog";


export class TimelogParser {

    options: { [index: string]: any } = {
        defaultDuration: 30,
        hourThreshold: 5,
        defaultRate: 255,
        defaultClient: '',
        defaultProject: '',
        defaultTask: '',
        defaultSource: ''

    }

    prefixes: { [index: string]: string } = {
        '@': 'clients', '#': 'tasks', '%': 'projects', '/': 'sources'
    };

    dateTimeHelper: DateTimeHelper;

    version: string = '1.0.0';

    propertyMatcherRegExp;
    durationMatchRegexp = /\+([\d:.]{1,5})/;

    constructor(options: { [index: string]: any } = {}) {
        this.options = {...this.options, ...options};
        this.dateTimeHelper = new DateTimeHelper();
        this.propertyMatcherRegExp = new RegExp(`([${Object.keys(this.prefixes).map(k => this.options.util.escapeRegExp(k)).join('|')}])([a-zA-Z0-9:_-]+)`, 'g');
        this.propertyMatcherRegExp = new RegExp(`([\/#@%])([a-zA-Z0-9:_-]+)`, 'g');
    }

    removePropertyFromString(string: string, property: string): string {
        property = this.options.util.escapeRegExp(property);
        const re = new RegExp("^" + property + "$|[^\\w]" + property + "[^\\w]|^" + property + "[^\\w]|[^\\w]" + property + "$", 'ig');
        return string.replace(re, ' ');
    }

    parse(logString: string, existingHash: string | boolean = false, defaultDate: Date | boolean = false): ITimelog {


        let hash = existingHash,
            date = defaultDate instanceof Date ? defaultDate : this.dateTimeHelper.parseDate();

        logString = this.dateTimeHelper.convertFormattedDateInString(logString, 'yyyy-mm-dd', this.options.dateFormat);

        logString = logString.replace(/&\s*/, '');

        if (/^~[a-f0-9]{16}/.test(logString)) {
            hash = logString.slice(1, 16);
            logString = logString.replace(/~[a-f0-9]{16}/, '');
        }

        const givenDate = logString.match(this.dateTimeHelper.formatRegExps(this.options.dateFormat).dateMatchRegExp);


        if (givenDate) {
            date = this.dateTimeHelper.parseDate(givenDate[2], this.options.dateFormat, defaultDate instanceof Date ? defaultDate : new Date());
            logString = logString.replace(givenDate[0], ' ');
        }

        const matches = logString.matchAll(this.propertyMatcherRegExp),
            parsed: ITimelog = {
                timestamp: +date,
                hash: hash ? hash : this.options.util.hash(8),
                clients: [],
                tasks: [],
                description: logString,
                sources: [],
                projects: [],
                duration: this.options.defaultDuration,
                normalized: '',
                cost: 0,
                rate: this.options.defaultRate,
                parserVersion: this.version
            };

        Array.from(matches).forEach(item => {
            //@ts-ignore
            parsed[this.prefixes[item[1]]].push(item[2]);
            parsed.description = this.removePropertyFromString(parsed.description, item[0]);
        });

        if (parsed.clients.length === 0 && this.options.defaultClient) {
            parsed.clients = [this.options.defaultClient];
        }

        if (parsed.projects.length === 0 && this.options.defaultProject) {
            parsed.projects = [this.options.defaultProject];
        }

        if (parsed.tasks.length === 0 && this.options.defaultTask) {
            parsed.tasks = [this.options.defaultTask];
        }

        if (parsed.sources.length === 0 && this.options.defaultSource) {
            parsed.sources = [this.options.defaultSource];
        }

        const givenDuration = logString.match(this.durationMatchRegexp);
        if (givenDuration) {
            parsed.duration = this.dateTimeHelper.parseDuration(givenDuration[0].slice(1),
                this.options.defaultDuration, this.options.hourThreshold);
            parsed.description = parsed.description.replace(givenDuration[0], ' ');
        }

        const givenRateOrFixedPrice = logString.match(/\$(\$?)([\d.]{1,6})/);
        if (givenRateOrFixedPrice) {
            if (givenRateOrFixedPrice[1] === '$') {
                parsed.cost = parseFloat(givenRateOrFixedPrice[2]);
                parsed.rate = null;
            } else {
                parsed.rate = parseFloat(givenRateOrFixedPrice[2]);
                parsed.cost = this.options.util.costFromRate(parsed.duration, parsed.rate);
            }
            parsed.description = this.removePropertyFromString(parsed.description, givenRateOrFixedPrice[0]);
        } else {
            parsed.cost = this.options.util.costFromRate(parsed.duration, this.options.defaultRate);
        }

        ['clients', 'projects', 'sources', 'tasks'].forEach((type: string) => {
            //@ts-ignore
            if (parsed[type].length > 1) {
                //@ts-ignore
                parsed[type] = [...new Set(parsed[type])];
            }
        });

        parsed.normalized = this.normalize(parsed);
        parsed.description = parsed.description.replace(/^~[a-f0-9]*\s?/, '');


        parsed.description = parsed.description.trim();


        return parsed;
    }

    normalize(timelog: ITimelog | IDecoratedTimelog): string {
        return [
            '~' + timelog.hash,
            '+' + this.options.util.formatDuration(timelog.duration),
            ':' + this.options.util.formatDate(timelog.timestamp),
            timelog.clients.length > 0 ? '@' + timelog.clients.join(' @') : null,
            timelog.projects.length > 0 ? '%' + timelog.projects.join(' %') : null,
            timelog.sources.length > 0 ? '/' + timelog.sources.join(' /') : null,
            timelog.tasks.length > 0 ? '#' + timelog.tasks.join(' #') : null,
            timelog.rate !== this.options.defaultRate && timelog.rate !== null ? '$' + String(timelog.rate) : null,
            timelog.rate === null ? '$$' + timelog.cost : null, timelog.description
        ].filter(e => !!e)
            .join(' ').replace(/[ ]{2,}/g, ' ');
    }

    decoratedParse(logString: string, defaultDate: Date | boolean = false): IDecoratedTimelog {


        const parsed: ITimelog = this.parse(logString, false, defaultDate);
        const isTimer: boolean = /&\s*$/.test(logString);
        const output: IDecoratedTimelog = {
            ...parsed, ...{

                usesDefaultClient: parsed.clients.length === 1 && parsed.clients[0] === this.options.defaultClient && logString.indexOf(parsed.clients[0]) < 0,
                usesDefaultProject: parsed.projects.length === 1 && parsed.projects[0] === this.options.defaultProject && logString.indexOf(parsed.projects[0]) < 0,
                usesDefaultTask: parsed.tasks.length === 1 && parsed.tasks[0] === this.options.defaultTask && logString.indexOf(parsed.tasks[0]) < 0,
                usesDefaultSource: parsed.sources.length === 1 && parsed.sources[0] === this.options.defaultSource && logString.indexOf(parsed.sources[0]) < 0,
                usesDefaultDuration: !logString.match(this.durationMatchRegexp),
                usesDefaultDate: !logString.match(this.dateTimeHelper.formatRegExps(this.options.dateFormat).dateMatchRegExp),
                usesDefaultRate: !logString.match(/\$\d+/),
                isTimer
            }

        }

        return output;
    }

    extend(source: ITimelog | string, targets: string[] | string, options: { [index: string]: any }):(string | ITimelog | IDecoratedTimelog)[] {
        options = {
            ...{
                normalized: true,
                includeSource: false,
                stripHash: true,
                defaultDate: false,
                forceDefaultDateOnDateless: false
            }, ...options
        };


        let actualSource: ITimelog | IDecoratedTimelog = (typeof source === 'string') ? this.decoratedParse(source, options.defaultDate) : source;

        let logs:(string | ITimelog | IDecoratedTimelog)[] = (typeof targets === 'string' ? [targets] : targets)
            .map(item => {
                item = item.replace(/\*+$/, '');
                let log: IDecoratedTimelog = this.decoratedParse(item, options.defaultDate);

                ['clients', 'projects', 'tasks', 'sources'].forEach((property:string) => {
                    if (log[property].length === 0) {
                        log[property] = actualSource[property].slice();
                    }
                });

                if (log.usesDefaultDuration && actualSource.duration !== log.duration) {
                    log.duration = actualSource.duration;
                }

                if (!log.description) {
                    log.description = actualSource.description;
                }

                if (!actualSource.usesDefaultDate && log.usesDefaultDate) {
                    log.timestamp = actualSource.timestamp;
                }

                if (log.usesDefaultDate && options.forceDefaultDateOnDateless) {
                    log.timestamp = +options.defaultDate;
                }

                if (!actualSource.usesDefaultRate && log.usesDefaultRate) {
                    log.rate = actualSource.rate;
                }


                if (!options.normalized) {
                    return log;
                }

                return this.normalize(log).replace(options.stripHash ? /^[~a-f0-9]+\s/ : '', '');
            });

        if (options.includeSource) {
            if(options.normalized){
                logs.unshift(this.normalize(actualSource).replace(options.stripHash ? /^[~a-f0-9]+\s/ : '', ''));
            }else{
                logs.unshift(actualSource);
            }

        }

        return logs;
    }
}