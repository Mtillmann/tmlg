import {settingTypes, visibleSettings} from "@/cli_settings";
import pc from "picocolors";
import {FsStorage} from "@/classes/FsStorage";
import type {ISettings} from "@/types/ISettings";

const process = require('process');
const inquirer = require('inquirer');

export class Settings {
    settings: ISettings;
    storage: FsStorage;

    constructor(settings: ISettings) {
        this.settings = settings;
        this.storage = new FsStorage();
    }

    list() {
        let settingsHidden = 0,
            settingsToShow = Object.keys(this.settings).reduce((obj: { [index: string]: string | boolean | number }, key: string): any => {
                if (visibleSettings.indexOf(key) > -1) {
                    obj[key] = this.settings[key];
                } else {
                    settingsHidden++;
                }
                return obj;
            }, {})
        console.table(settingsToShow);
        if (settingsHidden > 0) {
            console.log(`omitting ${settingsHidden} settings not relevant to CLI`);
        }
    }

    set(setting: string | null | boolean, value: string | boolean | number) {

        if (setting && setting !== '' && setting !== true && value) {

            const oldValue = setting in this.settings ? this.settings[setting] : 'n/a';
            let newValue: string | number | boolean = value;

            if (setting in settingTypes) {
                if (settingTypes[setting] === 'number') {
                    //@ts-ignore
                    newValue = parseFloat(newValue);
                }
                if (settingTypes[setting] === 'list') {

                    newValue = [true, 'true', 'on', 1, '1'].indexOf(newValue) > -1;
                }
            }


            this.settings[setting] = newValue;
            this.storage.set('settings', this.settings);
            console.log(pc.green(`Setting '${setting}' to '${newValue}' (old value: '${oldValue}')`));
            process.exit()
        }


        this.interactiveSet();
    }

    interactiveSet() {
        inquirer.prompt([{
            type: 'list',
            name: 'setting',
            message: 'select setting to edit',
            choices: Object.keys(this.settings).filter(key => visibleSettings.indexOf(key) > -1).map(key => ({
                name: `${key} ('${this.settings[key]}')`,
                value: key
            }))
        }], {}).then((answers: { [index: string]: any }) => {
            let question: { [index: string]: any } = {
                type: settingTypes[answers.setting],
                name: answers.setting,
                default: this.settings[answers.setting],
                message: answers.setting,
            };

            if (settingTypes[answers.setting] === 'list') {
                question.choices = [{name: 'on', value: true}, {name: 'off', value: false}]
            }

            inquirer.prompt([question], answers).then((answers: { [index: string]: any }) => {

                const key: string = answers.setting,
                    oldValue: string | number | boolean = key in this.settings ? this.settings[key] : 'n/a',
                    newValue: string | number | boolean = answers[key];

                this.settings[key] = newValue;
                this.storage.set('settings', this.settings);
                console.log(pc.green(`Setting '${key}' to '${newValue}' (old value: '${oldValue}')`));

                inquirer.prompt([{
                    type: 'confirm',
                    name: 'continue',
                    message: 'edit another setting?'
                }], {}).then((answers: { [index: string]: any }) => {
                    if (answers.continue) {
                        return this.interactiveSet()
                    }

                    process.exit();
                })

            })
        })
    }

}