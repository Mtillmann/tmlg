import pc from "picocolors";
import {FsStorage} from "@/classes/FsStorage";
import {Util} from "@/classes/Util";
import {TimelogParser} from "@/classes/TimelogParser";
import {TimelogStore} from "@/classes/TimelogStore";
import type {ISettings} from "@/types/ISettings";
import {NodePiggybackSync} from "@/classes/NodePiggybackSync";

const process = require('process');
const inquirer = require('inquirer');

export class Sync {
    settings: ISettings;
    credentials: { [index: string]: string | boolean | number };
    storage: FsStorage;
    sync: NodePiggybackSync;
    util: Util;
    timelogParser: TimelogParser;
    timelogStore: TimelogStore;

    constructor(settings: ISettings) {
        this.settings = settings;
        this.storage = new FsStorage();
        this.sync = new NodePiggybackSync(this.storage);
        this.credentials = this.storage.get('credentials');
        this.util = new Util();

        this.timelogParser = new TimelogParser({...settings, ...{util: this.util}});
        this.timelogStore = new TimelogStore(this.timelogParser, {
            deviceId: this.settings.deviceId,
            util: this.util,
            storeFunction: function () {
                //do nothing
            },
            storage: this.storage
        });

    }

    showCredentials() {
        if(this.credentials){

        console.table(this.credentials);
        }else{
            console.log('no sync credentials set')
        }
    }

    setup(argv: { [index: string]: any }) {

        const state = 'sync-disable' in argv ? false : ('sync-enable' in argv ? true : this.settings.syncEnabled),
            skipState = 'sync-disable' in argv || 'sync-enable' in argv,
            server = 'sync-server' in argv ? argv['sync-server'] : false,
            syncId = 'sync-id' in argv ? argv['sync-id'] : false,
            password = 'sync-password' in argv ? argv['sync-password'] : false;

        let answers:{[index:string]:string|boolean} = {};
        if(state){
            answers.state = state;
        }
        if(server){
            answers.server = server;
        }
        if(syncId){
            answers.syncId = syncId;
        }
        if(password){
            answers.password = password;
        }


        if (skipState && server && syncId && password) {
            this.sync.setCredentials(server, syncId, password, true);
            console.log(pc.green(`credentials written`));

            this.toggle(state);

            if ('sync' in argv) {
                this.synchronize();
            }
            process.exit();
        }

        inquirer.prompt([
            {
                type: 'list',
                name: 'enabled',
                message: 'enable sync',
                choices: [{name: 'enable', value: true}, {name: 'disable', value: false}],
                default: state,
                when: !skipState
            },
            {
                type: 'list',
                name: 'server',
                message: 'server',
                choices: [{
                    name: 'enter custom URL',
                    value: 'custom'
                }].concat(...this.sync.serverList.map(item => ({
                    name: `${item.url} - ${item.location} - ${item.storage}`,
                    value: item.url
                }))),
                default: server ? server : (this.credentials ? this.credentials.server : this.sync.serverList[0].url),
                when: !server
            },
            {
                type: 'input',
                name: 'server',
                message: 'customServer',
                when: (answers: { [index: string]: any }) => {
                    return answers.server === 'custom'
                }
            },
            {
                type: 'list',
                name: 'syncIdSource',
                message: 'syncId',
                choices: [
                    {name: 'generate new', value: 'generate'},
                    {name: 'enter manually', value: 'enter'},
                    {name: 'don\'t change', value: 'keep'}],
                default: syncId ? 'keep' : (this.credentials ? 'keep' : 'generate'),
                when: !syncId
            },
            {
                type: 'input',
                name: 'syncId',
                message: (answers: { [index: string]: any }) => {
                    if (answers.syncIdSource === 'generate') {
                        return 'syncId (generated)';
                    }
                    if (answers.syncIdSource === 'keep') {
                        return 'syncId (existing)';
                    }
                    return 'syncId';
                },
                default: syncId ? syncId : (answers: { [index: string]: any }) => {
                    if (answers.syncIdSource === 'generate') {
                        // @ts-ignore
                        return this.sync.generateNewSyncId(answers.customServer || answers.server).then(j => {
                            if (j.message) {
                                console.log(pc.red(`Service ERROR: ${j.message}`));
                                process.exit();
                            }
                            return j.id;
                        });
                    }
                    if (answers.syncIdSource === 'keep') {
                        return new Promise((resolve, reject) => {
                            resolve(this.credentials.syncId);
                        })
                    }

                    return new Promise((resolve, reject) => {
                        resolve('');
                    })
                },
                when: !syncId
            },
            {
                type: 'input',
                name: 'password',
                message: this.credentials ? 'password (current)' : 'password (new)',
                default: password ? password : (this.credentials ? this.credentials.password : this.util.hash(10)),
                when: !password
            },
            {
                type: 'confirm',
                name: 'looksgood',
                message: 'looks good?'
            }
        ], answers).then((answers: { [index: string]: any }) => {
            if (answers.looksgood) {
                this.sync.setCredentials(answers.customServer || answers.server, answers.syncId, answers.password, true);

                console.log(pc.green(`credentials written`));

                if (answers.enabled !== this.settings.syncEnabled) {
                    this.toggle(answers.enabled);
                }
                if ('sync' in argv) {
                    this.synchronize();
                }
                process.exit();

            }
        })
    }

    enable() {
        this.toggle(true);
    }

    disable() {
        this.toggle(false);
    }

    toggle(state?: boolean) {

        this.settings.syncEnabled = state !== undefined ? state : !this.settings.syncEnabled;
        this.storage.set('settings', this.settings);
        console.log(pc.green(`sync is now ${this.settings.syncEnabled ? 'enabled' : 'disabled'}`));

    }

    async synchronize(force?:boolean) {

        this.sync.needsUpdate().then(needsUpdate => {
            if (needsUpdate || force) {
                this.sync.load().then((resp:{[index:string]:any}) => {
                    if ('settings' in resp && resp.settings.syncSettings === true) {
                        let settingsUpdated = 0;
                        for (const key in resp.settings) {
                            if (this.settings[key] !== resp.settings[key]) {
                                this.settings[key] = resp.settings[key];
                                settingsUpdated++;
                            }
                        }
                        if (settingsUpdated > 0) {
                            console.log('settings synced');
                        }
                    }

                    if ('transactions' in resp) {
                        const merged = this.timelogStore.mergeTransactions(resp.transactions);
                        if (merged > 0) {
                            console.log(`synced ${merged} transactions...`)
                        }
                    }
                });
            }
        })
            .catch(error => {
                console.log('WTF ', error);
            })
            .finally(() => {
                this.timelogStore.commit(true);

                this.sync.store({
                    transactions: this.timelogStore.transactions,
                    settings: this.settings.$state
                }).then(json => {
                    console.log(pc.green(`${this.util.formatBytes(json.encrypted)} (${this.util.formatBytes(json.original)}) uploaded`))
                    console.log('sync complete');
                })

            })
    }
}