<template>
  <div
      class="modal fade"
      ref="modal"
      id="download"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="downloadLabel"
      aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="downloadLabel">Download</h5>
          <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <p class="alert alert-info" v-if="rows.length === 1">No rows to download, please adjust the filters.</p>
          <div v-else>

            <div class="mb-3">
              <label for="filename" class="form-label">Filename</label>
              <input type="text" class="form-control" id="filename" v-model="name">
            </div>

            <div class="form-check form-switch mb-2" v-for="(value, key) in cols">
              <input
                  class="form-check-input setting"
                  type="checkbox"
                  value=""
                  :id="`col-${key}`"
                  v-model="cols[key]"
              />
              <label class="form-check-label" :for="`col-${key}`">
                include <code>{{ key }}</code> column
              </label>
            </div>

          </div>

        </div>
        <div class="modal-footer" v-if="rows.length > 1">
          <button type="button" class="btn btn-primary" @click.stop.prevent="download('csv')">CSV</button>
          <button type="button" class="btn btn-primary" @click.stop.prevent="download('xlsx')">XLSX</button>
          <button type="button" class="btn btn-primary" @click.stop.prevent="download('ods')">ODS</button>
          <button type="button" class="btn btn-primary" @click.stop.prevent="download('txt')">TXT</button>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx/xlsx.mjs';
import {Modal} from "bootstrap";

export default {
  inject:['util', 'settings'],
  props: {
    tableData: {}
  },
  data() {


    return {
      cols: {
        date: true,
        clients: true,
        projects: true,
        tasks: true,
        sources: true,
        description: true,
        cost: this.settings.showCostColumn,
        rate: this.settings.showCostColumn,
        duration: true
      },
      modal: null
    }
  },
  computed: {
    name(){
      return this.util.escapeStringForFilename(this.settings.filenameTemplate.replace('%s',
          this.util.formatDateRangeByFormat(this.tableData.range.lower, this.tableData.range.upper, this.settings.dateRangeFormat)
      ));

    },
    defaultName(){
      return this.util.escapeStringForFilename(this.settings.filenameTemplate.replace('%s',
          this.util.formatDateRangeByFormat(this.tableData.range.lower, this.tableData.range.upper, this.settings.dateRangeFormat)
      ));

    },
    rows() {
      return this.tableData.days.reduce((aoa, day) => {

        let date = this.util.formatDate(day.date, this.settings.dateFormat);
        aoa.push(...day.logs.map(log => {
          let a = [];
          if (this.cols.date) {
            a.push(date);
          }

          if (this.cols.clients) {
            a.push(this.util.join(log.clients));
          }
          if (this.cols.projects) {
            a.push(this.util.join(log.projects));
          }
          if (this.cols.tasks) {
            a.push(this.util.join(log.tasks));
          }
          if (this.cols.sources) {
            a.push(this.util.join(log.sources));
          }
          if (this.cols.description) {
            a.push(log.description);
          }
          if (this.cols.cost) {
            a.push(this.util.formatAmount(log.cost, this.settings.currencyFormat));
          }
          if (this.cols.rate) {
            a.push(this.util.formatAmount(log.rate, this.settings.currencyFormat) + '/hr');
          }
          if (this.cols.duration) {
            a.push(this.util.formatDuration(log.duration));
          }

          return a;
        }));

        return aoa
      }, [this.columnTitles]);

    },
    columnTitles() {
      return Object.keys(this.cols).filter(item => this.cols[item]);
    }
  },
  mounted() {
    this.modal = new Modal(this.$refs.modal);
  },
  methods: {
    download(format) {

      const wb = new XLSX.utils.book_new(),
          options = {},
          name = this.util.escapeStringForFilename(this.name || this.defaultName);

      if (format === 'csv') {
        options.forceQuotes = true;
      }

      wb.Props = {
        Title: name,
        CreatedDate: new Date()
      };


      let data = XLSX.utils.aoa_to_sheet(this.rows);


      XLSX.utils.book_append_sheet(wb, data, name, true); // Sheet2
      XLSX.writeFile(wb, `${name}.${format}`, options);


    }
  }
}
</script>