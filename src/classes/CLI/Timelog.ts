import pc from "picocolors";
import {Util} from "@/classes/Util";
import {FsStorage} from "@/classes/FsStorage";
import {TimelogParser} from "@/classes/TimelogParser";
import {TimelogStore} from "@/classes/TimelogStore";
import type {ITimelog} from "@/types/ITimelog";
import type {IAnswers} from "@/types/IAnswers";
import type {ISettings} from "@/types/ISettings";
import {Sync} from "@/classes/CLI/Sync";
import {TimerCollection} from "@/classes/TimerCollection";

const process = require('process');
const inquirer = require('inquirer');

export class Timelog {
    util: Util;
    storage: FsStorage;
    settings: ISettings;
    timelogParser: TimelogParser;
    timelogStore: TimelogStore;
    timers: TimerCollection;

    constructor(settings: ISettings) {
        this.util = new Util();
        this.storage = new FsStorage();
        this.settings = settings;

        this.timelogParser = new TimelogParser({...settings, ...{util: this.util}});
        this.timers = new TimerCollection(this.storage, this.timelogParser);

        this.timelogStore = new TimelogStore(this.timelogParser, {
            deviceId: this.settings.deviceId,
            util: this.util,
            storeFunction: this.storeFn.bind(this),
            storage: this.storage
        });
    }

    storeFn() {
        (new Sync(this.settings)).synchronize(true);
    }

    create(string: string) {
        if (/&\s*$/.test(string)) {
            return this.time(string);
        }

        const strings = string.split('----');
        if (strings[0].trim().length === 0) {
            return;
        }

        strings.forEach(string => {

            const timelog: ITimelog = this.timelogParser.parse(string);
            this.timelogStore.insert(timelog);
            console.log(pc.green(`stored "${timelog.normalized}"`));
        })
    }

    time(string: string) {
        if (string.trim().length === 0) {
            return;
        }

        const timelog: ITimelog = this.timelogParser.parse(string);
        this.timers.setTimer(timelog);

        console.log(pc.green(`created timer...`));
    }

    pause(index: string) {
        this.timers.pause(parseInt(index, 10));
        console.log(pc.green(`timer "${index}" paused`));
    }

    unpause(index: string) {
        this.timers.unpause(parseInt(index, 10));
        console.log(pc.green(`timer "${index}" unpaused`));
    }

    kill(index: string) {
        this.timers.delete(parseInt(index, 10));
        console.log(pc.green(`timer "${index}" deleted`));
    }

    stop(index: string) {
        const timelog = this.timers.end(parseInt(index, 10));
        this.timelogStore.insert(timelog);

        console.log(pc.green(`timer "${index}" converted to log`));
    }

    logsFromHash(hash: string): ITimelog[] {
        let hashFragment = String(hash),
            hfl = hashFragment.length;
        if (hashFragment.length < 1) {
            console.log(pc.red('hash fragment must be at least 1 characters'));
            process.exit();
        }

        let logs = this.timelogStore.data.filter(l => l.hash.slice(0, hfl) === hashFragment);

        if (logs.length === 0) {
            console.log(pc.red('no log found for given hash'));
            process.exit();
        }

        return logs;
    }


    async delete(hash: string) {
        let actualLog = await this.findExactLog(this.logsFromHash(hash));

        this.timelogStore.delete(actualLog);
        console.log(pc.green(`deleted "${actualLog.hash}"`));
    }

    async edit(hash: string) {


        let actualLog: ITimelog = await this.findExactLog(this.logsFromHash(hash));

        return inquirer.prompt([
                {
                    type: 'editor',
                    name: 'log',
                    default: actualLog.normalized.slice(17),
                    message: 'timelog'
                }
            ], {}
        ).then((answers: IAnswers) => {
            let newLog: ITimelog = this.timelogParser.parse(answers.log, actualLog.hash);
            this.timelogStore.update(newLog);
            //todo respect date change edit keep log setting here as well?

            console.log(pc.green(`stored "${newLog.normalized}"`));
        })
    }

    async findExactLog(logs: any[]): Promise<ITimelog> {
        return inquirer.prompt([
            {
                type: 'list',
                name: 'hash',
                message: 'select actual hash',
                choices: logs.map((log: ITimelog) => ({
                    //@ts-ignore
                    name: `${log.hash} - ${this.util.formatDate(log.timestamp, this.settings.dateFormat)}`,
                    value: log.hash
                })),
                when: logs.length > 1
            }
        ], {}).then((answers: IAnswers) => {
            if (answers.hash) {
                // @ts-ignore
                return logs.filter(l => l.hash === answers.hash)[0];
            }
            return logs[0];
        });
    }

    listTimers() {
        if (this.timers.timers.length > 0) {
            console.table(this.timers.timers.map(timer => {
                let r = {
                    state: timer.state === 'running' ? pc.bgGreen('running') : 'paused',
                    duration: this.util.formatDuration(timer.state === 'running' ? (this.timers.duration(timer.started) + timer.minutes) : timer.minutes),
                    clients: this.util.join(timer.timelog.clients, '@'),
                    projects: this.util.join(timer.timelog.projects, '%'),
                    tasks: this.util.join(timer.timelog.tasks, '#'),
                    sources: this.util.join(timer.timelog.sources, '/'),
                    description: timer.timelog.description,
                };


                if (this.settings.showCostColumn) {

                    // @ts-ignore
                    r.cost = this.util.formatAmount(this.util.costFromRate((this.timers.duration(timer.started) + timer.minutes), timer.timelog.rate), this.settings.currencyFormat)
                }

                return r;

            }));
        }
    }

}