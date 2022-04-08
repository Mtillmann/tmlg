<template>
  <div class="modal fade" ref="modal" id="importSyncCredentials" data-bs-backdrop="static" data-bs-keyboard="false"
       tabindex="-1" aria-labelledby="importSyncCredentialsLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="importSyncCredentialsLabel">

            Import Sync Credentials

          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">



          <div class="row">
            <div class="col-12">

              <p class="alert alert-warning" v-if="sync.hasCredentials">
                Warning, this browser already has a syncId stored. Proceeding will disconnect from
                the currently used synchronization and may cause data loss!
              </p>

              <div class="mb-3">
                <label for="password" class="form-label">To import the encrypted syncId,
                  please enter the encryption password you used for that syncId:</label>
                <div class="input-group">
                  <input class="form-control"
                         :type="passwordType"
                         autocomplete="current-password"
                         id="password"
                         v-model="password"
                  >
                  <button class="btn-outline-secondary btn" id="passwordAddon"
                          @click="passwordType = passwordType === 'password' ? 'text' : 'password'"
                  >{{ passwordType === 'password' ? 'show' : 'hide' }}
                  </button>
                </div>
              </div>

              <p class="alert alert-danger" v-if="encryptedSyncCredentialsError">
                The provided password failed to decrypt the syncId :(
              </p>

              <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-outline-primary"
                        :disabled="!password"
                        @click="decryptEncryptedPassword">
                  Import syncId
                </button>
              </div>

            </div>
          </div>




        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {PiggyBackSync} from "@/classes/PiggyBackSync";
import {Modal} from "bootstrap";

export default {
  inject: ['util', 'globalStore', 'settings'],
  name: 'ImportSyncCredentialsFromURLDialog',
  props: {
    sync: PiggyBackSync
  },
  data() {
    return {
      modal: false,


      encryptedSyncCredentials : null,
      syncId: null,
      server: '',
      passwordType: 'password',
      password: '',
      encryptedSyncCredentialsError: false,
      decryptedSyncCredentials: null,
      urlIncludesPassword : false,
    }
  },

  mounted() {
    //create modal...
    this.modal = new Modal(this.$refs.modal);


  },
  methods: {
    show() {

      this.encryptedSyncCredentials = (new URL(window.location)).searchParams.get('encryptedSyncCredentials');

      if((new URL(window.location)).searchParams.has('password')){
        this.urlIncludesPassword = true;
        this.password = atob((new URL(window.location)).searchParams.get('password'));
        this.passwordType = 'text';
      }

      const url = new URL(window.location);
      url.searchParams.delete('encryptedSyncCredentials')
      url.searchParams.delete('password')
      window.history.replaceState({}, document.title, url.toString());

      this.modal.show();
    },
    decryptEncryptedPassword() {
      this.sync.decryptData(this.encryptedSyncCredentials, this.password)
          .then(decrypted => {
            try {
              const parsed = JSON.parse(decrypted);
              this.sync.setCredentials(parsed.server, parsed.syncId, this.password);

              //todo check last update here again
              this.sync.storeCredentials();


              this.globalStore.toast('Sync', 'Credentials successfully imported!');
              this.modal.hide();

            } catch (e) {
              this.encryptedSyncCredentialsError = true;
            }
          })
    }
  }
}
</script>