import {Util} from "@/classes/Util";
import {FsStorage} from "@/classes/FsStorage";
import {TimelogParser} from "@/classes/TimelogParser";
import {TimelogStore} from "@/classes/TimelogStore";
import type {ITimelog} from "@/types/ITimelog";
import type {ITimelogResult} from "@/types/ITimelogResult";
import type {ITimelogResultDay} from "@/types/ITimelogResultDay";
import type {ISettings} from "@/types/ISettings";

import * as XLSX from 'xlsx'
const process = require('process');
const fs = require('fs');

export class List {
    util: Util;
    storage: FsStorage;
    settings: ISettings;
    timelogParser: TimelogParser;
    timelogStore: TimelogStore;

    constructor(settings: ISettings) {
        this.util = new Util();
        this.storage = new FsStorage();
        this.settings = settings;


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

    tableize(result: ITimelogResult, columns: string[]): Array<{ [index: string]: string }> {
        let rows: Array<{ [index: string]: string }> = [];
        Object.values(result.days).forEach((day: ITimelogResultDay) => {

            day.logs.forEach((log: ITimelog) => {

                let n: { [index: string]: string } = {};
                columns.forEach((col: string) => {
                    if (col === 'hash' && columns.indexOf(col) > -1) {
                        n[col] = log.hash.slice(0, 4) + '...';
                    }
                    if (col === 'date' && columns.indexOf(col) > -1) {
                        n[col] = this.timelogParser.dateTimeHelper.formatDate(log.timestamp, this.settings.dateFormat);
                    }
                    if (['clients', 'tasks', 'projects', 'sources'].indexOf(col) > -1 && columns.indexOf(col) > -1) {
                        //@ts-ignore
                        n[col] = this.util.join(log[col]);
                    }
                    if (col === 'duration' && columns.indexOf(col) > -1) {
                        n[col] = this.util.formatDuration(log.duration);
                    }
                    if (col === 'cost' && columns.indexOf(col) > -1) {
                        //@ts-ignore
                        n[col] = this.util.formatCost(this.util.costFromRate(log.duration, log.rate), this.settings.currencyFormat);
                    }
                    if (col === 'description' && columns.indexOf(col) > -1) {
                        n[col] = log.description;
                    }
                });
                rows.push(n);
            });
        })
        return rows;
    }

    getColumns(columns?: string[]): string[] {
        let columnsToUse: string[];

        if (columns) {
            columnsToUse = columns;
        } else {
            columnsToUse = [
                'hash', 'date',
                this.settings.showClientColumn ? 'clients' : '',
                this.settings.showTaskColumn ? 'tasks' : '',
                this.settings.showProjectColumn ? 'projects' : '',
                this.settings.showSourceColumn ? 'sources' : '',
                'duration',
                this.settings.showCostColumn ? 'cost' : '',
                'description'
            ].filter(i => i !== '');
        }

        return columnsToUse;

    }

    list(take: number = 10, skip: number = 0, columns?: string[], exportFilename?: string) {


        let result = this.timelogStore.slice(skip, skip + take);

        console.table(this.tableize(result, this.getColumns(columns)));
    }

    range(date: string, mode: string, columns?: string[], exportFilename?: string) {

        date = String(date);

        let timestamp = date !== 'true' ?
                this.timelogParser.dateTimeHelper.convertFormattedDateInString(date, this.settings.dateFormat, this.timelogParser.dateTimeHelper.internalFormat) :
                this.timelogParser.dateTimeHelper.formatDate(new Date(), this.timelogParser.dateTimeHelper.internalFormat),
            range = this.util.dateRange(mode, timestamp),
            result = this.timelogStore.get(range.lower, range.upper);

        if (exportFilename) {
            const wb = XLSX.utils.book_new(),
                options:{[index:string]:any} = {},
                extension = exportFilename.split('.').pop(),
                filename = this.util.escapeStringForFilename(exportFilename);


            if (extension === 'csv') {
                options.forceQuotes = true;
            }

            wb.Props = {
                Title: filename,
                CreatedDate: new Date()
            };

            const tableRows = this.tableize(result, this.getColumns(columns).slice(1));

            if(tableRows.length === 0){
                console.error('no logs found for given date / params');
                process.exit();
            }

            const rows = tableRows.reduce((aoa, row) => {
                aoa.push(Object.values(row));
                return aoa;
            }, [Object.keys(tableRows[0])])


            const data = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, data, filename);

            //@ts-ignore
            const buffer = XLSX.write(wb, {type:'buffer', bookType: extension});
            fs.writeFileSync(filename, buffer,  "binary");


            process.exit();
        }

        const logs = this.tableize(result, this.getColumns(columns))

        if(logs.length === 0){
            console.error('no logs found for given date / params');
            process.exit();
        }

        console.log(`showing logs from ${this.timelogParser.dateTimeHelper.formatDate(range.lower, this.settings.dateFormat)} to ${this.timelogParser.dateTimeHelper.formatDate(range.upper, this.settings.dateFormat)}`)
        console.table(logs);

    }

}