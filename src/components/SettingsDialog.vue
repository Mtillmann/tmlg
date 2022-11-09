<template>
  <div
      class="modal fade"
      ref="modal"
      id="settings"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="settingsLabel"
      aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="settingsLabel">Settings</h5>
          <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">

          <ul class="nav nav-tabs mb-4">
            <li class="nav-item">
              <a class="nav-link px-2 px-lg-3" :class="{active : currentTab === 'input'}" href="#"
                 @click.stop.prevent="currentTab = 'input'">Input</a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-2 px-lg-3" :class="{active : currentTab === 'sync'}" href="#"
                 @click.stop.prevent="currentTab = 'sync'">
                <span class="d-none d-lg-inline">Synchronization</span>
                <span class="d-lg-none">Sync</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-2 px-lg-3" :class="{active : currentTab === 'timelogs'}" href="#"
                 @click.stop.prevent="currentTab = 'timelogs'">
                <span class="d-none d-lg-inline">Timelogs</span>
                <span class="d-lg-none">Logs</span>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-2 px-lg-3" :class="{active : currentTab === 'table'}" href="#"
                 @click.stop.prevent="currentTab = 'table'">Table</a>
            </li>
            <li class="nav-item">
              <a class="nav-link px-2 px-lg-3" :class="{active : currentTab === 'misc'}" href="#"
                 @click.stop.prevent="currentTab = 'misc'">Misc</a>
            </li>

          </ul>

          <div v-show="currentTab === 'input'">
            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="storeOnControlEnter"
                  v-model="settings.storeOnControlEnter"
              >
              <label class="form-check-label" for="storeOnControlEnter">
                store on <kbd>ctrl</kbd>+<kbd>enter</kbd>
                (<kbd>cmd</kbd>+<kbd>enter</kbd>)
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="clearTimeLogOnStore"
                  v-model="settings.clearTimeLogOnStore"
              >
              <label class="form-check-label" for="clearTimeLogOnStore">
                clear timelog on store
              </label>
            </div>
            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showParsePreviewOnType"
                  v-model="settings.showParsePreviewOnType"
              >
              <label class="form-check-label" for="showParsePreviewOnType">
                show parsed data while typing
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showHelpIcon"
                  v-model="settings.showHelpIcon"
              >
              <label class="form-check-label" for="showHelpIcon">
                show help icon
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="defaultDateInsideSelection"
                  v-model="settings.defaultDateInsideSelection"
              >
              <label class="form-check-label" for="defaultDateInsideSelection">
                default date always in range
              </label>
              <p class="small">When <code>:date</code> is omitted in timelogs and selected range does not cover current date, log is created inside the selected range</p>
            </div>

          </div>
          <div v-show="currentTab === 'sync'">

            <p class="small" v-if="!sync.hasCredentials">
              Set up sync credentials first to enable sync features
            </p>

            <div :class="{ 'opacity-25': !sync.hasCredentials }">
              <div class="form-check form-switch mb-4">
                <input
                    :disabled="!sync.hasCredentials"
                    class="form-check-input setting"
                    type="checkbox"
                    value=""
                    id="syncEnabled"
                    v-model="settings.syncEnabled"
                >
                <label class="form-check-label" for="syncEnabled">
                  sync enabled
                </label>
              </div>

              <div class="form-check form-switch mb-4">
                <input
                    :disabled="!sync.hasCredentials"
                    class="form-check-input setting"
                    type="checkbox"
                    value=""
                    id="syncSettings"
                    v-model="settings.syncSettings"
                >
                <label class="form-check-label" for="syncSettings">
                  sync settings
                </label>
              </div>

              <div class="form-check form-switch mb-4">
                <input
                    :disabled="!sync.hasCredentials"
                    class="form-check-input setting"
                    type="checkbox"
                    value=""
                    id="syncSettings"
                    v-model="settings.syncOnLoad"
                >
                <label class="form-check-label" for="syncOnLoad">
                  sync on load
                </label>
              </div>

              <div class="mb-4">
                <label for="syncAfterSeconds" class="form-label mb-0"
                >seconds to wait after log insert before sync (0=off):</label
                >
                <div class="row g-1">
                  <div class="col-2">
                    <input
                        :disabled="!sync.hasCredentials"
                        id="syncAfterSeconds"
                        class="form-control form-control-sm"
                        min="0"
                        max="240"
                        type="number"
                        v-model.number="settings.syncAfterSeconds"
                    >
                  </div>
                  <div class="col-10 pt-1">
                    <input
                        :disabled="!sync.hasCredentials"
                        type="range"
                        class="form-range"
                        min="0"
                        max="600"
                        v-model.number="settings.syncAfterSeconds"
                    >
                  </div>
                </div>
              </div>

              <div class="mb-4">
                <label for="checkForUpdateIntervalMinutes" class="form-label mb-0"
                >sync interval minutes (0=off):</label
                >
                <div class="row g-1">
                  <div class="col-2">
                    <input
                        :disabled="!sync.hasCredentials"
                        id="checkForUpdateIntervalMinutes"
                        class="form-control form-control-sm"
                        min="0"
                        max="240"
                        type="number"
                        v-model.number="settings.checkForUpdateIntervalMinutes"
                    >
                  </div>
                  <div class="col-10 pt-1">
                    <input
                        :disabled="!sync.hasCredentials"
                        type="range"
                        class="form-range"
                        min="0"
                        max="240"
                        v-model.number="settings.checkForUpdateIntervalMinutes"
                    >
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div v-show="currentTab === 'timelogs'">

            <div class="mb-4">
              <label for="defaultDuration" class="form-label mb-0"
              >Default duration minutes:</label
              >
              <div class="row g-1">
                <div class="col-2">
                  <input
                      id="defaultDuration"
                      class="form-control form-control-sm"
                      min="5"
                      max="240"
                      type="number"
                      v-model.number="settings.defaultDuration"
                  >
                </div>
                <div class="col-10 pt-1">
                  <input
                      type="range"
                      class="form-range"
                      min="5"
                      max="240"
                      v-model.number="settings.defaultDuration"
                  >
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label for="hourThreshold" class="form-label mb-0"
              >Single digit hour threshold:</label
              >
              <div class="row g-1">
                <div class="col-2">
                  <input
                      id="hourThreshold"
                      class="form-control form-control-sm"
                      min="1"
                      max="24"
                      type="number"
                      v-model.number="settings.hourThreshold"
                  >
                </div>
                <div class="col-10 pt-1">
                  <input
                      type="range"
                      class="form-range"
                      min="1"
                      max="24"
                      v-model.number="settings.hourThreshold"
                  >
                </div>
              </div>
            </div>

            <div class="mb-4">
              <label for="defaultRate" class="form-label mb-0"
              >Default rate ({{ util.formatAmount(settings.defaultRate, settings.currencyFormat) }}):</label
              >
              <div class="row g-1">
                <div class="col-2">
                  <input
                      id="defaultRate"
                      class="form-control form-control-sm"
                      min="0"
                      max="1000"
                      type="number"
                      v-model.number="settings.defaultRate"
                  >
                </div>
                <div class="col-10 pt-1">
                  <input
                      type="range"
                      class="form-range"
                      min="0"
                      max="1000"
                      v-model.number="settings.defaultRate"
                  >
                </div>
              </div>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="rateIncludesTax"
                  v-model="settings.rateIncludesTax"
              >
              <label class="form-check-label" for="rateIncludesTax">
                rate includes tax
              </label>
            </div>

            <div class="mb-4">
              <label for="tax" class="form-label mb-0">Tax rate (%):</label>
              <div class="row g-1">
                <div class="col-2">
                  <input
                      id="tax"
                      class="form-control form-control-sm"
                      min="0"
                      max="100"
                      step="0.1"
                      type="number"
                      v-model.number="settings.tax"
                  >
                </div>
                <div class="col-10 pt-1">
                  <input
                      type="range"
                      class="form-range"
                      min="0"
                      max="100"
                      step="0.1"
                      v-model.number="settings.tax"
                  >
                </div>
              </div>
            </div>

            <div class="input-group input-group-sm mb-4">
              <div class="input-group-text"><label for="dateFormat">Date Format</label>
                <a tabindex="0"
                   role="button"
                   class="badge border rounded-circle small ms-2"
                   data-bs-toggle="popover"
                   data-bs-content="the date format must include yy, mm and dddd, in any order, separated by any character"
                >?</a></div>
              <input
                  type="text"
                  class="form-control"
                  :class="{'is-invalid' : !dateFormatIsValid}"
                  id="dateFormat"
                  v-model="settings.dateFormat"
              >
            </div>

            <div class="input-group input-group-sm mb-4">
              <div class="input-group-text"><label for="currencyFormat">Currency Format</label>
                <a class="badge border rounded-circle small ms-2"
                   tabindex="0"
                   role="button"
                   data-bs-toggle="popover" data-bs-content="%s will be replaced with actual amount"
                >?</a></div>
              <input
                  type="text"
                  class="form-control"
                  :class="{'is-invalid' : !currencyIsValid}"
                  id="currencyFormat"
                  v-model="settings.currencyFormat"
              >
            </div>

            <div class="input-group input-group-sm mb-4 position-relative">
              <label for="defaultProject" class="input-group-text">Default %project</label>
              <input
                  type="text"
                  class="form-control"
                  id="defaultProject"
                  v-model="settings.defaultProject"
              >
              <span
                  class="position-absolute end-0 top-50 translate-middle btn btn-sm btn-close pe-0"
                  @click="settings.defaultProject = ''"
                  v-if="settings.defaultProject"
              ></span>
            </div>

            <div class="input-group input-group-sm mb-4">
              <label for="defaultClient" class="input-group-text"
              >Default @client</label
              >
              <input
                  type="text"
                  class="form-control"
                  id="defaultClient"
                  v-model="settings.defaultClient"
              >
              <span
                  class="position-absolute end-0 top-50 translate-middle btn btn-sm btn-close pe-0"
                  @click="settings.defaultClient = ''"
                  v-if="settings.defaultClient"
              ></span>
            </div>

            <div class="input-group input-group-sm mb-4">
              <label for="defaultTask" class="input-group-text"
              >Default #task</label
              >
              <input
                  type="text"
                  class="form-control"
                  id="defaultTask"
                  v-model="settings.defaultTask"
              >
              <span
                  class="position-absolute end-0 top-50 translate-middle btn btn-sm btn-close pe-0"
                  @click="settings.defaultTask = ''"
                  v-if="settings.defaultTask"
              ></span>
            </div>

            <div class="input-group input-group-sm mb-4">
              <label for="defaultSource" class="input-group-text"
              >Default /source</label
              >
              <input
                  type="text"
                  class="form-control"
                  id="defaultSource"
                  v-model="settings.defaultSource"
              >
              <span
                  class="position-absolute end-0 top-50 translate-middle btn btn-sm btn-close pe-0"
                  @click="settings.defaultSource = ''"
                  v-if="settings.defaultSource"
              ></span>
            </div>

          </div>
          <div v-show="currentTab === 'table'">

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showCostColumn"
                  v-model="settings.showCostColumn"
              >
              <label class="form-check-label" for="showCostColumn">
                show <code>cost</code> column
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showProjectColumn"
                  v-model="settings.showProjectColumn"
              >
              <label class="form-check-label" for="showProjectColumn">
                show <code>project</code> column
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showClientColumn"
                  v-model="settings.showClientColumn"
              >
              <label class="form-check-label" for="showClientColumn">
                show <code>client</code> column
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showTaskColumn"
                  v-model="settings.showTaskColumn"
              >
              <label class="form-check-label" for="showTaskColumn">
                show <code>task</code> column
              </label>
            </div>
            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showSourceColumn"
                  v-model="settings.showSourceColumn"
              >
              <label class="form-check-label" for="showSourceColumn">
                show <code>source</code> column
              </label>
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showIndexColumn"
                  v-model="settings.showIndexColumn"
              >
              <label class="form-check-label" for="showIndexColumn">
                show <code>index</code> column, if you want to use <code>!n</code> syntax
              </label>
            </div>


            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="showDupeButton"
                  v-model="settings.showDupeButton"
              >
              <label class="form-check-label" for="showDupeButton">
                show duplicate button
              </label>
            </div>


          </div>
          <div v-show="currentTab === 'misc'">
            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="keepOriginalLogOnEdit"
                  v-model="settings.keepOriginalLogOnEdit"
              >
              <label class="form-check-label" for="keepOriginalLogOnEdit">
                keep original log when date is changed while editing
              </label>
            </div>

            <div class="input-group input-group-sm mb-4">
              <div class="input-group-text"><label for="dateRangeFormat">
                <span class="d-none d-lg-inline">Date Range Format</span>
                <span class="d-lg-none">Dt Rng Frmt</span>
              </label>
                <a tabindex="0" role="button" class="badge border rounded-circle small ms-2"
                   data-bs-toggle="popover"
                   data-bs-content="Same as date format. Start date placeholders with trailing '?' will be omitted when date component is same on end date"
                >?</a></div>
              <input
                  type="text"
                  class="form-control"
                  id="dateRangeFormat"
                  :class="{'is-invalid' : !dateRangeFormatIsValid}"
                  v-model="settings.dateRangeFormat"
              >
            </div>

            <div class="form-check form-switch mb-4">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  id="closeFiltersOnApply"
                  v-model="settings.closeFiltersOnApply"
              >
              <label class="form-check-label" for="closeFiltersOnApply">
                Close Filters on Apply/Clear
              </label>
            </div>

            <div class="input-group input-group-sm mb-4">
              <div class="input-group-text"><label for="filenameTemplate">DL Filename</label>
                <a tabindex="0" role="button" class="badge border rounded-circle small ms-2"
                   data-bs-toggle="popover"
                   data-bs-content="%s will be replaced with date range"
                >?</a></div>

              <input
                  type="text"
                  class="form-control"
                  id="filenameTemplate"
                  v-model="settings.filenameTemplate"
              >
            </div>

            <div class="input-group input-group-sm mb-4">
              <label for="deviceName" class="input-group-text">Device name</label>
              <input
                  type="text"
                  class="form-control"
                  id="deviceName"
                  v-model="settings.deviceName"
              >
            </div>

            <div class="input-group input-group-sm mb-4">
              <label for="deviceId" class="input-group-text">Device ID</label>
              <input
                  type="text"
                  class="form-control"
                  id="deviceId"
                  v-model="settings.deviceId"
                  readonly
              >
            </div>

          </div>

          <div class="d-flex justify-content-center">
            <button class="btn btn-primary" @click="saveSettings">
              Save settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
// @ts-nocheck
import {PiggyBackSync} from "@/classes/PiggyBackSync";
import {Modal, Popover} from "bootstrap";

export default {
  inject: ['util', 'globalStore', 'settings'],
  props: {
    sync: PiggyBackSync,
  },
  data() {
    return {
      modal: null,
      currencyIsValid: true,
      dateFormatIsValid: true,
      dateRangeFormatIsValid: true,
      currentTab: 'input'
    };
  },
  mounted() {
    //create modal...
    this.modal = new Modal(this.$refs.modal);
    //this.modal.show();

    Array.from(this.$refs.modal.querySelectorAll('[data-bs-toggle="popover"]')).forEach(node => {
      new Popover(node, {
        trigger: 'focus'
      })
    })
  },

  watch: {
    'settings': {
      deep: true,
      handler: function (newValue, oldValue) {


        this.checkValidity();

        this.settings.defaultClient = this.settings.defaultClient.replace(/[@%\/#:+]/g, '');
        this.settings.defaultProject = this.settings.defaultProject.replace(/[@%\/#:+]/g, '');
        this.settings.defaultTask = this.settings.defaultTask.replace(/[@%\/#:+]/g, '');
        this.settings.defaultSource = this.settings.defaultSource.replace(/[@%\/#:+]/g, '');

        if (this.settings.syncEnabled) {
          this.$emit('enable-sync');
        }

      }
    }
  },

  methods: {
    checkValidity() {
      const df = this.settings.dateFormat;
      const drf = this.settings.dateRangeFormat;
      this.currencyIsValid = /%s/.test(this.settings.currencyFormat) && !/^%s$/.test(this.settings.currencyFormat.trim()) && this.settings.currencyFormat !== '';
      this.dateFormatIsValid = df.match(/d/g).length === 2 && df.match(/m/g).length === 2 && df.match(/y/g).length === 4;
      this.dateRangeFormatIsValid = drf.match(/dd/g).length === 2 && drf.match(/mm/g).length === 2 && drf.match(/yyyy/g).length === 2;

    },
    show() {
      this.modal.show();
    },
    saveSettings() {
      this.globalStore.toast('settings saved');

      if (this.settings.syncSettings) {
        //this.store();
        this.$emit("store");
      }
      this.modal.hide();
    },
  },
};
</script>

<style>
tbody tr {
  cursor: pointer;
}
</style>
