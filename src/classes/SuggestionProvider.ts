import {LocalStorage} from "@/classes/LocalStorage";
import type {TimelogStore} from "@/classes/TimelogStore";

export class SuggestionProvider {
    data:{[index:string]: any} = {};
    logStore;
    storage;

    constructor(logStore: TimelogStore) {
        this.logStore = logStore;

        this.storage = new LocalStorage();

        this.data = this.storage.get('suggestions');

        if(!this.data){
            this.data = {};
            this.rebuild();
        }
    }

    get(type: string, fragment: string, amount = 10): string[] {

        let suggestions = [];
        for (let i = 0; i < this.data[type].length; i++) {
            if (this.data[type][i][0].indexOf(fragment) === 0) {
                suggestions.push(this.data[type][i][0]);
            }

            if (suggestions.length === amount) {
                break;
            }
        }

        return suggestions;
    }

    updateFromLog(log: { [index: string]: any }): void {
        Object.keys(this.data).forEach(key => {
            log[key].forEach((string: string) => this.insert(key, string))
        });
        this.storage.set('suggestions', this.data);
    }

    insert(type: string, string: string): void {
        for (let i = 0; i < this.data[type].length; i++) {
            if (this.data[type][i][0] === string) {
                this.data[type][i][1]++;
                this.reorder(type);
                return;
            }
        }

        this.data[type].push([string, 1]);
        this.reorder(type);
    }

    rebuild() {
        const maps:{[index:string] : any} = {
                clients: {},
                projects: {},
                tasks: {},
                sources: {}
            },
            upsert = (map: string, string: string) => {
                if (string in maps[map]) {
                    maps[map][string]++;
                    return;
                }
                maps[map][string] = 1;
            };

        this.logStore.data.forEach((log : {[index:string]:any[]}) => {
            log.clients.forEach(client => upsert('clients', client));
            log.tasks.forEach(task => upsert('tasks', task));
            log.projects.forEach(project => upsert('projects', project));
            log.sources.forEach(source => upsert('sources', source));
        });

        Object.keys(maps).forEach(type => {
            let suggestions = [];
            for (const term in maps[type]) {
                suggestions.push([term, maps[type][term]]);
            }
            this.data[type] = suggestions;
            this.reorder(type)
        });

        this.storage.set('suggestions', this.data);
    }

    reorder(type:string):void {
        this.data[type].sort((a:Array<any>, b:Array<any>) => b[1] - a[1]);
    }
}