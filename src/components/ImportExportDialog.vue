<template>
  <div class="modal fade" ref="modal" id="importExportModal" data-bs-backdrop="static"
       data-bs-keyboard="false"
       tabindex="-1" aria-labelledby="importExportModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="importExportModalLabel">Import/Export</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

          <ul class="nav nav-tabs" id="importExportTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="import-tab" data-bs-toggle="tab" data-bs-target="#import" type="button"
                      role="tab" aria-controls="import" :class="{active : view === 'import'}"
                      :aria-selected="view === 'import'"
                      @click="view = 'import'">Import
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="export-tab" data-bs-toggle="tab" data-bs-target="#export" type="button"
                      role="tab" aria-controls="export" :class="{active : view === 'export'}"
                      :aria-selected="view === 'export'"
                      @click="view = 'export'">Export
              </button>
            </li>

          </ul>
          <div class="tab-content mt-3" id="importExportTabsContent">
            <div class="tab-pane fade" :class="{active : view === 'import', show : view === 'import'}" id="import"
                 role="tabpanel" aria-labelledby="import-tab">

              <div v-if="importView === 'select'">
                <label for="importFile" class="form-label">File to import</label>
                <input ref="fileInput" class="form-control form-control-lg" id="importFile" type="file" accept=".json">
              </div>
              <div v-else-if="importView === 'error'" class="alert alert-danger">
                The given file was malformed or does not contain data that can be imported. <a href="#"
                                                                                               @click.stop.prevent="importView = 'select'">Try
                again</a>
              </div>
              <div v-else-if="importView === 'confirm'">
                <div class="form-check form-switch mb-2">
                  <input :disabled="importData && !('data' in importData)" class="form-check-input" type="checkbox"
                         id="import-data" v-model="imports.data"/>
                  <label class="form-check-label" for="import-data">
                    Import <code>data</code> from given file
                  </label>
                </div>

                <div class="form-check form-switch mb-2">
                  <input :disabled="importData && !('settings' in importData)" class="form-check-input" type="checkbox"
                         id="import-settings" v-model="imports.settings"/>
                  <label class="form-check-label" for="import-settings">
                    Import <code>settings</code> from given file
                  </label>
                </div>

                <div class="form-check form-switch mb-2">
                  <input :disabled="importData && !('syncCredentials' in importData)" class="form-check-input"
                         type="checkbox"
                         id="import-synccredentials" v-model="imports.syncCredentials"/>
                  <label class="form-check-label" for="import-synccredentials">
                    Import <code>sync credentials</code> from given file
                  </label>
                </div>

                <div class="alert alert-warning">
                  Existing data will be wiped!
                </div>

              </div>

            </div>
            <div class="tab-pane fade" :class="{active : view === 'export', show : view === 'export'}" id="export"
                 role="tabpanel" aria-labelledby="export-tab">

              <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="export-data" v-model="exports.data"/>
                <label class="form-check-label" for="export-data">
                  Include <code>data</code> in the export. <br> <small>Sync Transactions are included as well if they
                  exist.</small>
                </label>
              </div>

              <div class="form-check form-switch mb-2">
                <input class="form-check-input" type="checkbox" id="export-settings" v-model="exports.settings"/>
                <label class="form-check-label" for="export-settings">
                  Include <code>settings</code> in the export. <br> <small>Exporting the settings will restore all your
                  settings when you import.</small>
                </label>
              </div>

              <div class="form-check form-switch mb-2">
                <input :disabled="!sync.hasCredentials" class="form-check-input" type="checkbox"
                       id="export-synccredentials" v-model="exports.syncCredentials"/>
                <label class="form-check-label" for="export-synccredentials">
                  Include <code>sync credentials</code> in the export.
                  <br>
                  <small>Exporting the settings will restore all your settings when you import.</small>
                </label>
              </div>

              <div class="alert alert-warning" v-if="sync.hasCredentials && exports.syncCredentials">
                Your password will be stored as <u>plain text</u> in the export file!
              </div>


            </div>

          </div>

        </div>
        <div class="modal-footer d-flex justify-content-center">

          <button v-if="view === 'export' && (exports.syncCredentials || exports.data || exports.settings)"
                  class="btn btn-outline-primary"
                  @click="download">Download
          </button>

          <button
              v-if="importView === 'confirm' && view === 'import' && (imports.syncCredentials || imports.data || imports.settings)"
              class="btn btn-outline-primary"
              @click="importFromData">Import now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {TimelogStore} from "@/classes/TimelogStore";
import {Modal} from "bootstrap";
import {PiggyBackSync} from "@/classes/PiggyBackSync";
import {SuggestionProvider} from "@/classes/SuggestionProvider";
import {LocalStorage} from "@/classes/LocalStorage";


export default {
  name: "ImportExportDialog",
  inject: ['settings', 'util'],

  props: {
    timelogStore: TimelogStore,
    sync: PiggyBackSync,
    suggestionProvider: SuggestionProvider
  },

  data() {
    return {
      importData: false,
      importView: 'select',
      view: 'import',
      modal: null,
      exports: {

        settings: true,
        syncCredentials: this.sync.hasCredentials,
        data: true
      },

      imports: {
        settings: true,
        syncCredentials: true,
        data: true
      },

    }
  },
  mounted() {
    //create modal...
    this.modal = new Modal(this.$refs.modal);
    //this.modal.show();

    this.$refs.modal.addEventListener('hidden.bs.modal', () => {
      this.view = 'import';
      this.importView = 'select'
      this.importData = null;
    })


    this.$refs.fileInput.addEventListener("change", this.handleFileChange.bind(this), false);

  },
  methods: {

    show() {
      this.modal.show()
    },
    handleFileChange(e) {
      //const fileList = this.files; /* now you can work with the file list */

      const file = e.target.files[0];
      if (file) {
        fetch(window.URL.createObjectURL(file))
            .then(r => r.json())
            .then(json => {
              let isWellFormed = 'includes' in json && ('settings' in json || 'data' in json || 'syncCredentials' in json);
              if (!isWellFormed) {
                return this.importView = 'error';
              }

              this.importData = json;
              this.importView = 'confirm';

            })
            .catch(() => {
              this.importView = 'error';
            })

      }
    },

    download() {
      let data = {
        includes: [],
      };

      if (this.exports.settings) {
        const settings = JSON.parse(JSON.stringify({...this.settings.$state}));

        data.includes.push('Settings');
        data.settings = settings;
      }

      if (this.exports.data) {
        data.includes.push('Data');
        data.data = JSON.parse(JSON.stringify(this.timelogStore.data));
        data.transactions = JSON.parse(JSON.stringify(this.timelogStore.transactions));
      }

      if (this.exports.syncCredentials) {
        data.includes.push('syncCredentials');
        data.syncCredentials = JSON.parse(JSON.stringify(this.sync.getCredentials()));
      }

      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data)));
      element.setAttribute('download', `Timelog Export (${data.includes.join(', ')}).json`);
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);


    },
    importFromData() {

      let storage = new LocalStorage();

      if (this.imports.data) {
        storage.set('data', this.importData.data);
        storage.set('transactions', this.importData.transactions);
        storage.remove('suggestions');

      }

      if (this.imports.settings) {
        storage.set('settings', this.importData.settings);
      }

      if (this.imports.syncCredentials) {
        storage.set('credentials', this.importData.syncCredentials);
        storage.remove('lastUpdated')
      }

      window.location.reload();

    }
  }

}
</script>

<style scoped>

</style>