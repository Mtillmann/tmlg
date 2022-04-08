<template>
  <div class="modal fade" ref="modal" id="syncSetup" data-bs-backdrop="static" data-bs-keyboard="false"
       tabindex="-1" aria-labelledby="syncSetupLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="syncSetupLabel">
            <span v-show="view === 'status' && sync.hasCredentials">Sync Info
            </span>
            <span v-show="view === 'status' && !sync.hasCredentials">Synchronization
            </span>
            <span v-show="view === 'login'">Login</span>
            <span v-show="view === 'register'">Register</span>
            <span v-show="view === 'registerError'">Registration failed</span>
            <span v-show="view === 'showSyncURL'">Sync URL</span>
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

          <div class="row" v-show="view === 'status'">
            <div class="col-12">
              <table class="table table-sm" v-if="sync.hasCredentials">
                <tbody>
                <tr>
                  <th scope="row">server</th>
                  <td><code>{{ sync.server }}</code></td>
                </tr>
                <tr>
                  <th scope="row">syncId</th>
                  <td><code>{{ sync.syncId }}</code></td>
                </tr>
                <tr>
                  <th scope="row">password</th>
                  <td>
                    <div class="d-flex justify-content-between">


                      <code v-if="passwordType === 'password'">{{ sync.password.replace(/./g, '*') }}</code>
                      <code v-else>{{ sync.password }}</code>


                      <a href="#" @click.stop.prevent="passwordType = 'text'"
                         v-if="passwordType === 'password'">show</a>
                      <a href="#" @click.stop.prevent="passwordType = 'password'"
                         v-if="passwordType === 'text'">hide</a>

                    </div>
                  </td>
                </tr>

                <tr>
                  <th scope="row">last updated</th>
                  <td><code
                  >{{ sync.lastUpdated ? sync.lastUpdated.toLocaleString() : 'n/a' }}</code>
                  </td>
                </tr>
                </tbody>
              </table>


              <div v-if="hasCompressionStream && hasDecompressionStream && hasCrypto && hasCryptoSubtle">

                <div class="list-group list-group-flush">
                  <button @click="view = 'login'" type="button"
                          class="list-group-item text-center list-group-item-action"
                          v-if="!sync.hasCredentials">
                    connect with sync id and password
                  </button>
                  <button @click="view = 'serverSelect'" type="button"
                          class="list-group-item text-center list-group-item-action"
                          v-if="!sync.hasCredentials">
                    register new sync id and password
                  </button>
                  <button @click="forgetSyncCredentials" type="button"
                          class="list-group-item text-center list-group-item-action"
                          v-if="sync.hasCredentials"
                  >
                    remove currently stored credentials
                  </button>
                  <button @click="showSyncURL" type="button"
                          class="list-group-item text-center list-group-item-action"
                          v-if="sync.hasCredentials"
                  >
                    Connect other devices and platforms
                  </button>
                </div>
              </div>
              <div v-else>
                <p>
                  Sync is not available because wour browser doesn't support one or more of those features:
                </p>

                <table class="table">

                    <tr>
                      <td><code>CompressionStream</code></td>
                      <td>{{ hasCompressionStream ? 'ok' : 'no'}}</td>
                  </tr>
                    <tr>
                      <td><code>DecompressionStream</code></td>
                      <td>{{ hasDecompressionStream ? 'ok' : 'no'}}</td>
                  </tr>
                    <tr>
                      <td><code>Crypto</code></td>
                      <td>{{ hasCrypto ? 'ok' : 'no'}}</td>
                  </tr>
                    <tr>
                      <td><code>CryptoSubtle</code></td>
                      <td>{{ hasCryptoSubtle ? 'ok' : 'no'}}</td>
                  </tr>

                </table>
              </div>

            </div>
          </div>


          <div class="row" v-show="view === 'showSyncURL'">
            <div class="col-12">
              <div ref="qrcode" id="qrcode-wrap" class="mw-100 mx-auto"></div>

              <div class="form-check form-switch my-2" :class="{'text-warning' : includePasswordInQRCode}">
                <input
                    class="form-check-input setting"
                    type="checkbox"
                    value=""
                    id="include_password"
                    v-model="includePasswordInQRCode"
                />
                <label class="form-check-label" for="include_password">
                  Include Password in URL
                </label>
              </div>


              <div class="input-group mb-3">
                <input type="text" class="form-control" v-model="syncURL" readonly>
                <button class="btn btn-outline-secondary" type="button"
                        @click.stop.prevent="util.copyToClipboard(syncURL, $refs.qrcode); globalStore.toast('copied!')">copy
                </button>
              </div>
              <p>
                Open the URL on the device that you want to sync your timelogs on and enter your
                password when prompted.
              </p>

              <hr>
              <p>
                Use the command below to se tup a cli installation
              </p>

              <div class="input-group mb-3">
                <input type="text" class="form-control" v-model="syncCLICommand" readonly>
                <button class="btn btn-outline-secondary" type="button"
                        @click.stop.prevent="util.copyToClipboard(syncCLICommand, $refs.qrcode); globalStore.toast('copied!')">copy
                </button>
              </div>

              <p>
                Use <code>npm i tmlg -g</code> to install the app on your machine
              </p>

            </div>
          </div>


          <div class="row" v-show="view === 'login'">
            <div class="col-12">
              <div class="mb-1">

                <label for="server" class="form-label">Server</label>
                <input class="form-control" list="serverList" id="server"
                       placeholder="Type to search..."
                       v-model="server">
                <datalist id="serverList">

                  <option v-for="server in sync.serverList" :value="server.url"></option>

                </datalist>
              </div>
              <div class="mb-1">
                <label for="login_syncId" class="form-label">SyncId</label>
                <input class="form-control" id="login_syncId" v-model="syncId">
              </div>

              <div class="mb-1">
                <label for="login_password" class="form-label">Password</label>
                <div class="input-group">
                  <input class="form-control"
                         :type="passwordType"
                         autocomplete="current-password"
                         id="login_password"
                         v-model="password">
                  <button class="btn-outline-secondary btn" id="passwordAddon"
                          @click="passwordType = passwordType === 'password' ? 'text' : 'password'"
                  >{{ passwordType === 'password' ? 'show' : 'hide' }}
                  </button>
                </div>

              </div>

              <div class="alert alert-warning" v-if="loginError">{{ loginError }}
              </div>

              <div class="d-flex justify-content-center mt-3">
                <button class="btn btn-outline-primary"
                        @click="attemptLogin"
                        :disabled="!server || !syncId || !password"
                >Login
                </button>
              </div>


            </div>
          </div>


          <div class="row" v-show="view === 'registerError'">
            <div class="col-12">
              <p>There was an error fetching a new sync id from the service:</p>
              <p><code>{{ registerError }}</code></p>
            </div>
          </div>


          <div class="row" v-show="view === 'serverSelect'">
            <div class="col-12">

              <div class="mb-1">

                <label for="serverURL" class="form-label">API Server URL</label>
                <input class="form-control" type="url" id="serverURL"
                       v-model="server">
                <p class="my-1">
                  Public servers
                </p>
                <div class="list-group list-group-flush mb-3">


                  <button v-for="item in sync.serverList" class="list-group-item list-group-item-action"
                          @click="server = item.url">
                    <span>{{ item.url }}</span>
                    <br>
                    <small>{{ item.location + ', ' + item.storage }}</small>
                  </button>

                </div>
              </div>

              <div class="d-flex justify-content-center">
                <button class="btn btn-outline-primary"
                        @click="registerSyncId"
                        :disabled="!server"
                >Create Synchronization
                </button>
              </div>

            </div>
          </div>


          <div class="row" v-show="view === 'register'">
            <div class="col-12">
              <div class="mb-1">
                <label for="serverURL" class="form-label">Server</label>
                <input class="form-control" disabled id="serverURL" readonly v-model="server">
              </div>

              <div class="mb-1">
                <label for="syncId" class="form-label">SyncId</label>
                <input class="form-control" disabled id="syncId" readonly v-model="syncId">
              </div>

              <div class="mb-1">
                <label for="register_password" class="form-label">Password</label>
                <div class="input-group">
                  <input :class="{'is-invalid' : password && !passwordValid, 'is-valid' : password && passwordValid}"
                         class="form-control"
                         :type="passwordType"
                         autocomplete="new-password"
                         id="register_password"
                         v-model="password">
                  <button class="btn-outline-secondary btn" id="passwordAddon"
                          @click="passwordType = passwordType === 'password' ? 'text' : 'password'"
                  >{{ passwordType === 'password' ? 'show' : 'hide' }}
                  </button>
                </div>
              </div>
              <div class="mb-1">
                <label for="password_repeat" class="form-label">Repeat Password</label>
                <div class="input-group">
                  <input class="form-control"
                         :class="{'is-invalid' : passwordRepeat && !passwordRepeatValid, 'is-valid' : passwordRepeat && passwordRepeatValid}"
                         :type="passwordType"
                         autocomplete="new-password"
                         id="passwordRepeat"
                         v-model="passwordRepeat">
                  <button class="btn-outline-secondary btn" id="passwordRepeatAddon"
                          @click="passwordType = passwordType === 'password' ? 'text' : 'password'"
                  >{{ passwordType === 'password' ? 'show' : 'hide' }}
                  </button>
                </div>
              </div>

              <div class="small mb-1">
                <p class="mb-2">Make sure you save the password in your browser or password manager,
                  there is
                  <u>no way</u> to recover it!</p>
                <p>The password will be stored as plain text in your browser, so use an unique
                  password!</p>
              </div>

              <div class="d-flex justify-content-center">
                <button class="btn btn-outline-primary"
                        @click="setSyncCredentials"
                        :disabled="!passwordValid || !passwordRepeatValid"
                >Create Synchronization
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

import QRCode from 'easyqrcodejs';

export default {
  inject: ['util', 'globalStore', 'settings'],
  name: 'SyncOptionsDialog',
  props: {
    sync: PiggyBackSync
  },
  data() {
    return {
      modal: false,
      loginError: false,

      includePasswordInQRCode: false,

      syncId: null,
      server: '',
      passwordType: 'password',
      registerError: null,
      password: '',
      passwordRepeat: '',
      passwordValid: false,
      passwordRepeatValid: false,

      syncURL: null,
      syncCLICommand: null,
      view: 'status',
      hasCompressionStream: 'CompressionStream' in window,
      hasDecompressionStream: 'DecompressionStream' in window,
      hasCrypto: 'crypto' in window,
      hasCryptoSubtle: 'crypto' in window && 'subtle' in window.crypto
    }
  },
  watch: {
    password(newValue) {
      this.passwordValid = newValue.length > 7;
      this.passwordRepeatValid = this.password === this.passwordRepeat;

    },
    passwordRepeat() {

      this.passwordRepeatValid = this.password === this.passwordRepeat;
    },
    includePasswordInQRCode() {
      this.createQRCode();
    }
  },
  mounted() {
    //create modal...
    this.modal = new Modal(this.$refs.modal);
    //this.modal.show()

    this.$refs.modal.addEventListener('show.bs.modal', e => {
      this.server = this.sync.server || this.sync.serverList[0].url;
    });
    this.$refs.modal.addEventListener('hidden.bs.modal', e => {
      this.server = null;
      this.view = 'status';
      this.passwordType = 'password';
      this.registerError = null;
      this.password = '';
      this.passwordRepeat = '';
      this.passwordValid = false;
      this.passwordRepeatValid = false;
    })

  },
  methods: {
    show() {

      this.modal.show();
    },
    attemptLogin() {

      this.globalStore.setLoading(true);

      this.sync.setCredentials(this.server, this.syncId, this.password);
      this.sync.getLastUpdated().then(resp => {
        this.globalStore.setLoading(false);
        if ('error' in resp) {
          this.loginError = `Error: ${resp.message}`;
          return;
        }

        this.sync.storeCredentials();

        this.globalStore.toast('sync', 'login successful')
      });
    },
    showSyncURL() {

      this.view = 'showSyncURL';
      this.createQRCode();
    },
    createQRCode() {

      this.sync.createConnectionStrings(window.location.toString(), this.includePasswordInQRCode)
      .then((r) => {
        this.syncCLICommand = r.cli;
        this.syncURL = r.url;

        console.log({r})

        if (this.$refs.qrcode.querySelector('canvas')) {
          this.$refs.qrcode.querySelector('canvas').remove()
        }

        new QRCode(this.$refs.qrcode, {
          text: this.syncURL,
          //drawer : 'svg'
          quietZone: 40,
          width: 600,
          height: 600,
          onRenderingEnd: () => {
            this.$refs.qrcode.querySelector('canvas').classList.add('img-fluid', 'd-block')
            this.$refs.qrcode.querySelector('canvas').style.setProperty('image-rendering', 'pixelated');
          }
        });
      })
    },
    registerSyncId() {
      this.globalStore.setLoading(true);
      this.view = 'register';
      this.sync.generateNewSyncId(this.server).then(responseJson => {
        this.globalStore.setLoading(false);
        if ('code' in responseJson && /exception/i.test(responseJson.code)) {
          this.view = 'registerError';
          this.registerError = responseJson.message;
        } else {
          this.syncId = responseJson.id;
        }
      })
    },
    setSyncCredentials() {
      this.sync.setCredentials(this.server, this.syncId, this.password);

      this.sync.getLastUpdated().then(resp => {
        if ('error' in resp) {

          this.registerError = resp.message;
          this.view = 'registerError';

          return;
        }

        this.sync.storeCredentials();
        this.modal.hide();
        this.globalStore.toast('sync', 'Synchronization is connected!')


      })

    },
    forgetSyncCredentials() {
      if (!confirm('are you sure?')) {
        return false;
      }
      this.settings.syncEnabled = false;
      this.sync.forgetCredentials();
      this.modal.hide();
      this.globalStore.toast('sync', 'your credentials have been removed...')
    },

  }
}
</script>

<style>
#qrcode-wrap canvas {
  display: none;
}
</style>