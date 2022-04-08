<template>
  <div class="modal fade" ref="modal" id="inspectDataModal" data-bs-backdrop="static"
       data-bs-keyboard="false"
       tabindex="-1" aria-labelledby="inspectDataModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="inspectDataModalLabel">Inspect local data</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">


          <div v-if="view === 'detail'">
            <button class="btn btn-link"
                    @click="view = 'transactions'">back
            </button>
            <table class="table-sm table">

              <tbody>

              <tr>
                <td>Hash</td>
                <td>{{ timelogStore.transactions[transactionIndex].hash }}</td>
              </tr>
              <tr>
                <td>device</td>
                <td>
                  {{
                    timelogStore.transactions[transactionIndex].origin === settings.deviceId ? 'this device' : String(timelogStore.transactions[transactionIndex].origin).slice(0, 4) + '...'
                  }}
                </td>
              </tr>
              <tr>
                <td>created</td>
                <td>{{
                    util.formatDate(timelogStore.transactions[transactionIndex].createdAt, settings.dateFormat)
                  }}
                </td>
              </tr>
              <tr>
                <td>committed</td>
                <td>
                  <span
                      v-if="timelogStore.transactions[transactionIndex].committedAt">{{
                      util.formatDate(timelogStore.transactions[transactionIndex].committedAt, settings.dateFormat)
                    }}</span>

                  <a v-else href="#"
                     @click.stop.prevent="timelogStore.commit(true)">commit</a>

                </td>
              </tr>

              </tbody>
            </table>

            <template v-for="(key, keyIndex) in ['insert','delete','update']">

              <div v-if="key in timelogStore.transactions[transactionIndex].operations">
                <h5>{{ key }}</h5>
                <ul class="list-group list-group-flush">
                  <li class="list-group-item"
                      v-for="(t, i) in timelogStore.transactions[transactionIndex].operations[key]">
                    <pre><code>{{ t }}</code></pre>
                  </li>
                </ul>
              </div>
            </template>

          </div>


          <div class="table-responsive" v-if="view === 'transactions'">
            <h5>Transactions</h5>
            <table class="table table-sm table-hover">
              <thead>
              <tr>
                <th>
                  hash
                </th>
                <th>
                  origin
                </th>
                <th>
                  created
                </th>
                <th>
                  committed
                </th>
                <th>
                  inserts
                </th>
                <th>
                  updates
                </th>
                <th>
                  deletes
                </th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="(t, i) in timelogStore.transactions.slice().reverse()"
                  @click="showTransaction(i)"
                  class="cursor-pointer">

                <td>{{ t.hash.slice(0, 4) + '...' }}</td>

                <td>{{ t.origin === settings.deviceId ? 'this device' : String(t.origin).slice(0, 4) + '...' }}</td>


                <td>{{ util.formatDate(t.createdAt, settings.dateFormat) }}</td>
                <td>

                  <span v-if="t.committedAt">{{ util.formatDate(t.committedAt, settings.dateFormat) }}</span>
                  <a v-else href="#"
                     @click.stop.prevent="timelogStore.commit(true)">commit</a>

                </td>
                <td>{{ t.operations.insert ? t.operations.insert.length : 0 }}</td>
                <td>{{ t.operations.update ? t.operations.update.length : 0 }}</td>
                <td>{{ t.operations.delete ? t.operations.delete.length : 0 }}</td>
              </tr>

              </tbody>
            </table>
          </div>


        </div>
      </div>
    </div>
  </div>
</template>
<script>
import {TimelogStore} from "@/classes/TimelogStore";
import {Modal, Popover} from "bootstrap";

export default {
  inject: ['settings', 'util'],
  name: 'InspectDialog',
  props: {
    timelogStore: TimelogStore
  },

  data() {
    return {
      view: 'transactions',
      transactionIndex: 0,
      modal: null
    }
  },
  mounted() {
    //create modal...
    this.modal = new Modal(this.$refs.modal);
    //this.modal.show();
    this.$refs.modal.addEventListener('shown.bs.modal', e => this.view = 'transactions');
    this.$refs.modal.addEventListener('hidden.bs.modal', e => this.view = null);
  },

  methods: {
    showTransaction(index){
      this.view = 'detail';
      this.transactionIndex = this.timelogStore.transactions.length - index - 1;
    },
    show() {
      this.modal.show();
    },
  }
}
</script>