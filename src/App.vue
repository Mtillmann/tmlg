<script>


import SyncOptionsDialog from "@/components/SyncOptionsDialog.vue";
import SettingsDialog from "@/components/SettingsDialog.vue";
import InspectDialog from "@/components/InspectDialog.vue";
import ToastBox from "@/components/ToastBox.vue";
import OffCanvasMenu from "@/components/OffCanvasMenu.vue";
import InputBox from "@/components/InputBox.vue";
import LogTable from "@/components/LogTable.vue";
import LoadingModal from "@/components/LoadingModal.vue";
import TopBar from "@/components/TopBar.vue";
import ImportExportDialog from "@/components/ImportExportDialog.vue";
import ImportSyncCredentialsFromURLDialog from "@/components/ImportSyncCredentialsFromURLDialog.vue";
import HelpDialog from "@/components/HelpDialog.vue";
import TimerList from "@/components/TimerList.vue";

import {LocalStorage} from "@/classes/LocalStorage";
import {PiggyBackSync} from "@/classes/PiggyBackSync";
import {TimelogParser} from "@/classes/TimelogParser";
import {useSettingsStore} from "@/stores/settings";
import {TimelogStore} from "@/classes/TimelogStore";
import {SuggestionProvider} from "@/classes/SuggestionProvider";
import {TimerCollection} from "@/classes/TimerCollection";



export default {
  inject: ['util', 'globalStore', 'settings'],
  components: {
    TimerList,
    HelpDialog,
    ImportExportDialog, ImportSyncCredentialsFromURLDialog,
    SyncOptionsDialog, SettingsDialog, ToastBox, LogTable, InputBox, LoadingModal, TopBar, OffCanvasMenu, InspectDialog
  },
  data() {
    const storage = new LocalStorage();
    const parser = new TimelogParser({...useSettingsStore(), ...{util: this.util}});
    const timelogStore = new TimelogStore(parser, {
      deviceId: this.settings.deviceId,
      util: this.util,
      storeFunction: this.store.bind(this),
      storage: storage
    });
    const suggestionProvider = new SuggestionProvider(timelogStore);

    return {
      syncIsRunning: false,
      suggestionProvider,
      timelogStore,
      storage,
      parser,
      sync: new PiggyBackSync(storage),
      timers : new TimerCollection(storage, parser)
    };
  },
  mounted() {
    this.timelogStore.checkIntegrity()

    if (this.settings.syncEnabled && this.sync.hasCredentials) {
      this.syncIfNeeded();
    }

    if ((new URL(window.location)).searchParams.has('encryptedSyncCredentials')) {
      this.$refs.importFromURL.show();
    }

    if(/h=([\w]+)/.test(window.location.hash)){
      this.$refs.help.show(/h=([\w]+)/.exec(window.location.hash)[1]);
      window.location.hash = '';
    }

  },
  watch:{
    settings : {
      deep : true,
      handler : function() {
        Object.keys(this.parser.options).forEach(key => {
          if(key in this.settings){
            this.parser.options[key] = this.settings[key];
          }
        });
      }
    }
  },
  methods: {
    enableSync() {
      if (!this.syncIsRunning && this.sync.hasCredentials) {
        this.globalStore.toast('sync enabled');
        this.syncIfNeeded(true);
      }
    },

    syncIfNeeded(toast = false, forceUpdate = false) {

      this.sync.needsUpdate().then(needsUpdate => {
        if (needsUpdate || forceUpdate) {
          this.sync.load().then(resp => {

            if ('settings' in resp && resp.settings.syncSettings === true) {
              let settingsUpdated = 0;
              for (const key in resp.settings) {
                if (key !== 'deviceName' && key !== 'deviceId' && this.settings[key] !== resp.settings[key]) {
                  this.settings[key] = resp.settings[key];
                  settingsUpdated++;
                }
              }
              if (settingsUpdated > 0) {
                this.globalStore.toast('settings synced');
              }
            }

            if ('transactions' in resp) {
              const merged = this.timelogStore.mergeTransactions(resp.transactions);
              if (merged > 0) {
                this.globalStore.toast(`synced ${merged} transactions...`)
              }

              this.suggestionProvider.rebuild();
            }

            this.$refs.logTable.updateTableData();

            if (!!this.timelogStore.currentTransaction) {
              this.store();
            }
          });
        } else {
          if (!!this.timelogStore.currentTransaction) {
            this.store();
          }
        }

        if (toast) {
          this.globalStore.toast('synced...');
        }
      })
          .catch(error => {
            this.globalStore.toast('sync', error);
          });

      this.setSyncTimeout();

    },

    setSyncTimeout() {
      const minutes = this.settings.checkForUpdateIntervalMinutes;
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;

      if (Math.abs(minutes) === 0 || !this.settings.syncEnabled) {
        console.log('disabling sync')
        this.syncIsRunning = false;
        return;
      }

      this.syncIsRunning = true;

      this.syncTimeout = setTimeout(this.syncIfNeeded.bind(this), minutes * 60 * 1000);
    },

    store() {
      this.globalStore.setLoading(true);

      this.timelogStore.commit(true);

      this.sync.store({
        transactions: this.timelogStore.transactions,
        settings: this.settings.$state
      }).then(json => {
        this.globalStore.setLoading(false);
        this.globalStore.toast(`${this.util.formatBytes(json.encrypted)} (${this.util.formatBytes(json.original)}) uploaded`)
      });
    },

    syncNow(){
      this.syncIfNeeded(true, true);
      setTimeout(this.store.bind(this), 2500);
    },

    logFromTimer(log){
      this.timelogStore.insert(log);
      this.$refs.logTable.updateTableData();
      this.globalStore.toast('created log from timer...')
    }

  }
};
</script>

<template>

  <LoadingModal></LoadingModal>
  <TopBar></TopBar>
  <div class="container">
    <InputBox ref="input" :parser="parser" :log-store="timelogStore"
              :suggestion-provider="suggestionProvider"
              :timers="timers"
              @show-help="$refs.help.show('help')"
              @reload-table="$refs.logTable.updateTableData()"
    ></InputBox>
    <TimerList v-if="timers.timers.length > 0"
               :timers="timers"
               :log-parser="parser"
               @end-timer="logFromTimer"
    ></TimerList>

    <LogTable ref="logTable"
              :log-store="timelogStore"
              :log-parser="parser"
              :suggestion-provider="suggestionProvider"
              @hide-suggestions="$refs.input.unsetSuggestions()"
              @edit-log="log => $refs.input.editLog(log)"
    ></LogTable>
  </div>
  <SettingsDialog ref="settings" :storage="storage" :sync="sync"
                  @enable-sync="enableSync"
  ></SettingsDialog>
  <HelpDialog ref="help" :parser="parser"></HelpDialog>
  <SyncOptionsDialog ref="syncOptions" :sync="sync"></SyncOptionsDialog>
  <InspectDialog ref="inspect" :timelog-store="timelogStore"></InspectDialog>
  <ImportExportDialog ref="importExport" :timelog-store="timelogStore" :sync="sync"
                      :suggestion-provider="suggestionProvider"></ImportExportDialog>
  <ImportSyncCredentialsFromURLDialog ref="importFromURL" :sync="sync"></ImportSyncCredentialsFromURLDialog>
  <ToastBox></ToastBox>
  <OffCanvasMenu
      :sync="sync"
      @show-settings="$refs.settings.show()"
      @show-sync-options="$refs.syncOptions.show()"
      @inspect-data="$refs.inspect.show()"
      @show-import-dialog="$refs.importExport.show()"
      @sync-now="syncNow()"
      @show-help-dialog="$refs.help.show()"
  ></OffCanvasMenu>
</template>

<style>
@import url("../node_modules/bootstrap-dark-5/dist/css/bootstrap-nightfall.css") (prefers-color-scheme: dark);

.btn-icon {
  background-repeat: no-repeat;
  background-position: center;
  background-size: 65%;
  position: relative;
  min-height: 25px;
  padding-top: 0;
  padding-bottom: 0;
}


.btn-icon svg {
  position: absolute;
  transform: translate(-50%, -50%);
  object-fit: contain;
  height: 18px;

  top: 50%;
  left: 50%;
  max-height: 100%;
}


</style>

<style scoped>


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>