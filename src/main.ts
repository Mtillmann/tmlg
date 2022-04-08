// @ts-nocheck
import "bootstrap/dist/css/bootstrap.min.css";

import {createApp} from "vue";
import App from "./App.vue";
import {createPinia} from 'pinia';
import {Util} from "@/classes/Util";
import {useGlobalStore} from '@/stores/global';
import {useSettingsStore} from "@/stores/settings";
import {LocalStorage} from "@/classes/LocalStorage";

//import "../node_modules/ua-parser-js/dist/ua-parser.min.js";
import { UAParser } from 'ua-parser-js'
import {DateTimeHelper} from "@/classes/DateTimeHelper";

const app = createApp(App);
app.use(createPinia());

const util = new Util(),
    globalStore = useGlobalStore(),
    settingsStore = useSettingsStore();

app.provide('util', util);
app.provide('globalStore', globalStore);
app.provide('settings', settingsStore);



settingsStore.$subscribe(() => {
    const storage = new LocalStorage(),
        settings = {...settingsStore.$state};
    storage.set('settings', settings);
}, {detached: true})


if(!settingsStore.showHelpIcon){
    settingsStore.$patch({showHelpIcon : true});
}

if (!settingsStore.deviceId) {
    settingsStore.deviceId = util.hash(16);

    // @ts-ignore
    const parsed = new UAParser().getResult();
    settingsStore.deviceName = `${parsed.browser.name} on ${parsed.os.name} ${parsed.os.version} (${parsed.cpu.architecture})`;
}


app.mount("#app");
