import {defineStore} from 'pinia'
import {LocalStorage} from "@/classes/LocalStorage";
import {defaultSettings} from "@/settings";
import {Util} from "@/classes/Util";

export const useSettingsStore = defineStore('settings', {
    state: () => {
        const storage = new LocalStorage();


        const {defaultDateFormat, defaultDateRangeFormat} = (new Util()).defaultDates();


        return storage.get('settings', {
            ...defaultSettings,
            ...{dateFormat: defaultDateFormat, dateRangeFormat: defaultDateRangeFormat}
        })
    },
    actions: {
        update(key:string, value:any) {
            this[key] = value;
        }
    }
})