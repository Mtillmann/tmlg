import type {TimelogParser} from "@/classes/TimelogParser";
import type {ITimelog} from "@/types/ITimelog";
import type {ITimelogResult} from "@/types/ITimelogResult";

export class TimelogStore {
    data: any[] = [];
    index: { [index: number]: number } = {};


    transactions: any[] = [];
    timelogParser: TimelogParser;
    transactionItemLimit = 16;
    options: { [index: string]: any };
    currentTransaction: { [index: string]: any } | null = null;

    constructor(timelogParser: TimelogParser, options: { [index: string]: any }) {
        this.options = options;
        this.timelogParser = timelogParser;


        let localData: any[] | null = this.options.storage.get('data', []);

        // @ts-ignore
        if (localData.length > 0 && localData[0] !== null && 'day' in localData[0]) {
            console.log('purging old version data...')
            this.options.storage.set('data', []);
            localData = [];
        }

        if (localData) {
            this.data = localData;
        }


        let localTransactions: any[] | null = this.options.storage.get('transactions');
        if (localTransactions) {
            this.transactions = localTransactions;
        }

        if (this.transactions.length > 0 && !this.transactions[this.transactions.length - 1].committedAt) {
            this.currentTransaction = this.transactions[this.transactions.length - 1];
        }


        this.makeIndex()
    }

    /**
     * is this ever required except for development?
     */
    checkIntegrity() {
        if (this.data.length > 0 && this.transactions.length === 0 && !this.currentTransaction && this.data.length > 0) {
            //something apparently has gone very wrong...
            this.data.forEach(timelog => this.addToTransaction(timelog));
            this.commit(true);
        } else if (this.transactions.length > 0 && this.data.length === 0) {
            this.commit(false);
            let transactions = this.transactions.slice();
            this.transactions = [];
            this.mergeTransactions(transactions);
        }
    };

    makeIndex(): void {
        const index: { [index: number]: number } = {};
        for (let i = this.data.length - 1; i >= 0; i--) {
            index[this.data[i].timestamp] = Math.max(index[this.data[i].timestamp] || -Infinity, i);
        }
        this.index = index;
    }

    findIndexByDate(timestamp: number): number {

        let startIndex: number = timestamp in this.index ? this.index[timestamp] : this.data.length - 1;

        if (timestamp in this.index) {
            return this.index[timestamp] + 1;
        }

        if (this.data.length > 0 && timestamp > this.data[this.data.length - 1].timestamp) {
            return this.data.length;
        }

        if (this.data.length > 0 && timestamp < this.data[0].timestamp) {
            return 0;
        }


        for (let i: number = startIndex; i >= 0; i--) {
            if (this.data[i] && timestamp >= this.data[i].timestamp) {
                return i === this.data.length - 1 ? i - 1 : i + 1;
            }
        }
        return 0;
    }

    findTimelogIndex(timelog: { [index: string]: any }): number | boolean {

        if (this.data.length === 1) {
            return 0;
        }

        let index: number = this.findIndexByDate(timelog.timestamp);

        if (this.data[index] && this.data[index].hash === timelog.hash) {
            return index;
        }


        for (let i: number = index; i >= 0; i--) {

            if (this.data[i] && this.data[i].hash === timelog.hash) {
                return i;
            }
        }


        return false;
    }

    addToTransaction(timelog: { [index: string]: any }, method: string = 'insert'): boolean {


        if (!this.currentTransaction) {
            this.createTransaction();
        }


        // @ts-ignore
        if (!this.currentTransaction.operations.hasOwnProperty(method)) {
            // @ts-ignore
            this.currentTransaction.operations[method] = [];
        }

        if (method === 'update') {
            let recycled: boolean = false,
                methods: string[] = ['insert', 'update'];
            recycling: {
                for (let method of methods) {
                    // @ts-ignore
                    if (method in this.currentTransaction.operations) {
                        // @ts-ignore
                        for (let i = 0; i < this.currentTransaction.operations[method].length; i++) {
                            // @ts-ignore
                            if (this.currentTransaction.operations[method][i].indexOf(timelog.hash) === 1) {
                                // @ts-ignore
                                this.currentTransaction.operations[method].splice(i, 1, timelog.normalized);
                                recycled = true;
                                break recycling;
                            }
                        }
                    }
                }
            }
            if (!recycled) {
                // @ts-ignore
                this.currentTransaction.operations.update.push(timelog.normalized);
            }
        } else if (method === 'delete') {
            let existingItems: { [index: string]: boolean } = {insert: false, update: false},
                methods: string[] = ['insert', 'update'];
            for (let method of methods) {
                // @ts-ignore
                if (method in this.currentTransaction.operations) {
                    // @ts-ignore
                    for (let i: number = 0; i < this.currentTransaction.operations[method].length; i++) {
                        // @ts-ignore
                        if (this.currentTransaction.operations[method][i].indexOf(timelog.hash) === 1) {
                            // @ts-ignore
                            this.currentTransaction.operations[method].splice(i, 1);
                            existingItems[method] = true;
                            break;
                        }
                    }
                }
            }

            if (!existingItems.insert) {
                // @ts-ignore
                this.currentTransaction.operations.delete.push(timelog.normalized);
            }


        } else if (method === 'insert') {
            // @ts-ignore
            this.currentTransaction.operations.insert.push(timelog.normalized);
        }


        let transactionItemCount = 0;
        // @ts-ignore
        for (const key in this.currentTransaction.operations) {
            // @ts-ignore
            transactionItemCount += this.currentTransaction.operations[key].length;
        }

        if (transactionItemCount >= this.transactionItemLimit) {
            this.commit();
            this.options.storeFunction();
        }

        return true;
    }

    insert(timelog: ITimelog, noTransaction: boolean = false): boolean {
        const index: number = this.findIndexByDate(timelog.timestamp);
        this.data.splice(index, 0, timelog);
        if (!noTransaction) {
            this.addToTransaction(timelog);
        }
        this.store();
        return true;
    }

    store(): void {
        this.makeIndex();
        this.storeTransactions();
        this.options.storage.set('data', this.data);
        //localStorage.setItem('data', JSON.stringify(this.data));
    }


    delete(timelog: ITimelog, noTransaction: boolean = false): boolean {
        const index: number | boolean = this.findTimelogIndex(timelog);

        if (typeof index === "number") {
            this.data.splice(index, 1);
            if (!noTransaction) {
                this.addToTransaction(timelog, 'delete');
            }
        }

        this.store();
        return true;
    }

    update(timelog: ITimelog, noTransaction: boolean = false): boolean {
        const index: number | boolean = this.findTimelogIndex(timelog);
        if (typeof index === "number") {
            this.data[index] = timelog;
            if (!noTransaction) {
                this.addToTransaction(timelog, 'update');
            }
        }

        this.store();
        return true;
    }

    storeTransactions(): void {
        this.transactions.sort((a, b) => (a.committedAt || 10e12) - (b.committedAt || 10e12));
        this.options.storage.set('transactions', this.transactions);
        //window.localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    commit(store: boolean = false): void {
        if (this.currentTransaction) {

            for (const key in this.currentTransaction.operations) {
                if (this.currentTransaction.operations[key].length === 0) {
                    delete this.currentTransaction.operations[key];
                }
            }

            this.currentTransaction.committedAt = Date.now() + this.transactions.length;
            if (store) {
                this.storeTransactions();
            }
            // @ts-ignore
            this.currentTransaction = false;
            return;
        }
        if (store) {
            this.storeTransactions();
        }

    }

    createTransaction(): void {
        let now = Date.now();

        this.currentTransaction = {
            // @ts-ignore
            hash: this.options.util.hash(16),
            createdAt: now,
            committedAt: false,
            operations: {},
            origin: this.options.deviceId
        };
        this.transactions.push(this.currentTransaction);
    }

    //todo only store the normalized strings in transactions, expand them here
    mergeTransaction(transaction: Array<{ [index: string]: any }>): boolean {
        if (this.currentTransaction) {
            this.commit(true);
        }

        //check if transaction already is in list
        for (let i: number = 0; i < this.transactions.length; i++) {
            // @ts-ignore
            if (this.transactions[i].hash === transaction.hash) {
                return false;
            }
        }

        this.transactions.unshift(transaction);
        // @ts-ignore
        Object.keys(transaction.operations).forEach(operation => {
            // @ts-ignore
            transaction.operations[operation].forEach((item: string | { [index: string]: any }) => {
                if (typeof item === 'string') {
                    item = this.timelogParser.parse(item);
                }
                // @ts-ignore
                this[operation](item, true);
            })
        });

        this.storeTransactions();
        return true;
    }

    /**
     *
     * @param transactions
     */
    mergeTransactions(transactions: Array<any>): number {

        let merged: number = 0;

        for (let i = 0; i < transactions.length; i++) {
            let result = this.mergeTransaction(transactions[i]);
            merged += result ? 1 : 0;
        }
        return merged;
    }

    get(from: Date, to: Date, filters?: { [index: string]: string[] }): ITimelogResult {
        let upperIndex: null | number = null,
            lowerIndex: null | number = null;

        from.setHours(0)
        to.setHours(23.9)

        const range = {
                lower: from, upper: to
            },
            output: { [index: number]: any } = {},
            matchedProperties: { [index: string]: any[] } = {
                clients: [],
                projects: [],
                sources: [],
                tasks: []
            };

        if (this.data.length > 0 && this.data[this.data.length - 1].timestamp >= range.lower && this.data[0].timestamp <= range.upper) {

            for (let i = this.data.length - 1; i >= 0; i--) {
                if (this.data[i].timestamp <= range.upper && !upperIndex) {
                    upperIndex = i;
                }
                if (this.data[i].timestamp < range.lower) {
                    break;
                }

                lowerIndex = i;
            }

            //todo check what happens if upper is end of array.. ???
            // @ts-ignore
            const raw:ITimelog[] = this.data.slice(lowerIndex, upperIndex + 1).reverse(),
                defaultPass = !filters || !Object.values(filters).some((item: string[]): boolean => item.length > 0);


            raw.filter((item:ITimelog) => {
                return defaultPass || this.filter(filters, item);
            }).forEach((item:ITimelog) => {
                const ts: number = item.timestamp;

                if (!(ts in output)) {
                    output[ts] = {
                        date: new Date(ts), total: 0, cost: 0, logs: []
                    }
                }
                output[ts].total += item.duration;
                output[ts].cost += item.cost;
                output[ts].logs.push(item);
                //@ts-ignore
                Object.keys(matchedProperties).forEach(property => matchedProperties[property].push(...item[property]));

            });
        }

        Object.keys(matchedProperties).forEach(property => matchedProperties[property] = [...new Set(matchedProperties[property])]);

        return {
            matchedProperties,
            days: Object.values(output),
            range
        };
    }

    slice(start: number = 0, end: number = 10, filters?: { [index: string]: string[] }): ITimelogResult {

        const now = new Date,
            dummyDay = {
                date: now,
                logs: this.data.slice().reverse().slice(start, end),
                total: 0,
                cost: 0
            };


        return {
            days: {
                [0]: dummyDay
            },
            matchedProperties: {
                clients: [],
                projects: [],
                sources: [],
                tasks: []
            },
            range: {}
        }
    }

    filter(filters: { [index: string]: any }, item: { [index: string]: any }): boolean {

        for (const key in filters) {
            if (filters[key].length > 0 && !item[key].some((value: any): boolean => filters[key].includes(value))) {
                return false;
            }
        }
        return true;
    }

    /*
        reset() {
            this.data = [];
            this.transactions = [];
            this.store();
            this.storeTransactions();
            this.options.storeFunction();
        }

     */
}