import type {ITimelog} from "@/types/ITimelog";
import type {FsStorage} from "@/classes/FsStorage";
import type {LocalStorage} from "@/classes/LocalStorage";
import type {TimelogParser} from "@/classes/TimelogParser";

export class TimerCollection {

    timers: Array<{ started: Date, timelog: ITimelog, minutes: number, state: string }>;

    storage: FsStorage | LocalStorage;

    timelogParser: TimelogParser;

    constructor(storage: FsStorage | LocalStorage, timelogParser: TimelogParser) {
        this.storage = storage;
        let timers = this.storage.get('timers', []);
        // @ts-ignore
        this.timers = timers.map(t => ({...t, ...{started: new Date(t.started)}}))
        this.timelogParser = timelogParser;


    }

    getTimers() {
        return this.timers;
    }

    setTimer(timelog: ITimelog) {
        this.timers.unshift({
            started: new Date(),
            timelog: timelog,
            minutes: 0,
            state: 'running'
        });

        this.storeTimers();
    }

    storeTimers() {
        this.storage.set('timers', this.timers);
    }

    delete(index: number | string) {

        index = typeof index === 'string' ? this.hashToIndex(index) : index;
        this.end(index);
    }

    end(index: number | string): ITimelog {

        index = typeof index === 'string' ? this.hashToIndex(index) : index;

        let timer = this.timers[index],
            timelog: ITimelog = timer.timelog,
            duration = this.duration(timer.started);

        timelog.duration = Math.round(duration) + timer.minutes;

        if(timelog.duration === 0){
            timelog.duration = this.timelogParser.options.defaultDuration;
        }

        timelog.normalized = this.timelogParser.normalize(timelog);

        this.timers.splice(index, 1);
        this.storeTimers();
        return timelog;
    }

    pause(index: string | number) {
        index = typeof index === 'string' ? this.hashToIndex(index) : index;

        this.timers[index].state = 'paused';
        this.timers[index].minutes += this.duration(this.timers[index].started);

        this.storeTimers();
    }

    unpause(index: string | number) {
        index = typeof index === 'string' ? this.hashToIndex(index) : index;

        this.timers[index].state = 'running';
        this.timers[index].started = new Date();

        this.storeTimers();
    }


    toggle(index: number) {
        if (this.timers[index].state === 'running') {
            this.pause(index);
        } else {
            this.unpause(index);
        }
    }

    duration(start: Date): number {
        return Math.round((Date.now() - +start) / (60000));
    }


    hashToIndex(hash: string): number {
        return this.timers.map(item => {
            return item.timelog.hash;
        }).indexOf(hash);
    }

}