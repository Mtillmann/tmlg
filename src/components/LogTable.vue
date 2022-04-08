<template>
  <div>
    <div class="row g-0">
      <div class="col-12 mt-3 ">
        <h2 class="display-6 text-center fw-light">
          {{ util.formatDateRangeByFormat(fromDate, toDate, settings.dateRangeFormat) }}
          ({{ util.formatDuration(totalTime()) }})
          <template v-if="settings.showCostColumn"
                    v-html="'(' + util.formatCost(totalCost(), settings.currencyFormat, settings.tax, settings.rateIncludesTax) + ')'"></template>
        </h2>
      </div>

      <div class="col-12 d-flex justify-content-between my-3">
        <div>


          <div class="btn-group btn-group-sm h-100 me-1 me-lg-3" role="group" v-if="dateMode !== 'custom'">
            <button type="button" class="btn btn-outline-primary btn-icon"
                    @click="this.gotoDate(this.prevDate)"
                    id="range-prev">
              <ChevronLeft></ChevronLeft>
            </button>
            <button type="button" class="btn btn-outline-primary  btn-icon"
                    @click="this.gotoDate(this.nextDate)"
                    id="range-next">
              <ChevronRight></ChevronRight>
            </button>
          </div>
          <div class="btn-group btn-group-sm max-w-50" role="group">

            <input class="btn btn-outline-primary px-0" type="date"
                   v-model="fromDate" @change="updateTableData">

            <input class="btn btn-outline-primary px-0" type="date"
                   v-model="toDate" v-if="dateMode === 'custom'" @change="updateTableData">

          </div>
          <select class="ms-1 ms-lg-3 d-none d-lg-inline-block btn btn-outline-primary btn-sm" v-model="dateMode"
                  @change="changeDateMode">
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="custom">custom</option>
          </select>

          <select class="ms-2 px-0 d-lg-none btn btn-outline-primary btn-sm" v-model="dateMode"
                  @change="changeDateMode">
            <option value="week">wk</option>
            <option value="month">mo</option>
            <option value="custom">cu</option>
          </select>

        </div>


        <div class="dropdown">
          <button class="btn btn-sm btn-secondary dropdown-toggle" type="button" id="filters-and-download"
                  data-bs-reference="parent"
                  data-bs-toggle="dropdown" aria-expanded="false">

          </button>
          <ul class="dropdown-menu" aria-labelledby="filters-and-download">
            <li><a class="dropdown-item" href="#" @click.stop.prevent="$refs.filterDialog.modal.show()">Filter Data</a>
            </li>
            <li><a class="dropdown-item" href="#" @click.stop.prevent="$refs.downloadDialog.modal.show()">Download</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="col-12" v-if="isFiltered">
        <div class="btn-group btn-group-sm mb-2 me-2">
          <button class="btn btn-outline-primary btn-sm" @click="$refs.filterDialog.modal.show()">Change filters
          </button>
          <button class="btn btn-outline-primary btn-sm" @click="$refs.filterDialog.clear()">Clear all</button>
        </div>
        <template v-for="(filterList, key) in filters">
          <button type="button" class="btn btn-sm btn-outline-info me-2 mb-2" v-for="(filterItem, i) in filterList"
                  @click="$refs.filterDialog.toggleFilter(key, filterItem, true)">
            &times; {{ prefixPropertyMap[key] }}{{ filterItem }}
          </button>
        </template>
      </div>

      <div class="col-12">

        <p class="alert alert-info my-5" v-if="tableData.days.length === 0">
          no data for given date range
        </p>
        <template v-else>


          <div v-for="(data, dayIndex) in tableData.days">

            <h3 class="display-6">{{ util.formatDate(data.date, settings.dateFormat) }}</h3>

            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                <tr>

                  <th v-if="settings.showClientColumn">
                    <span class="d-none d-lg-inline">Client <span class="text-primary">@</span></span>
                    <span class="d-inline d-lg-none">Clt</span>
                  </th>

                  <th v-if="settings.showProjectColumn">
                    <span class="d-none d-lg-inline">Project <span class="text-primary">%</span></span>
                    <span class="d-inline d-lg-none">Prj</span>
                  </th>

                  <th v-if="settings.showTaskColumn">
                    Task <span class="d-none d-lg-inline text-primary">#</span>
                  </th>

                  <th v-if="settings.showSourceColumn">
                    <span class="d-none d-lg-inline">Source <span class="text-primary">/</span></span>
                    <span class="d-inline d-lg-none">Src</span>
                  </th>
                  <th>
                    <span class="d-none d-lg-inline">Description</span>
                    <span class="d-inline d-lg-none">Dsc</span>
                  </th>

                  <th v-if="settings.showCostColumn">Cost</th>
                  <th>
                    <span class="d-none d-lg-inline">Duration</span>
                    <span class="d-inline d-lg-none">Dur</span>
                  </th>

                  <th v-if="settings.showDupeButton"></th>
                  <th></th>
                  <th></th>
                </tr>
                </thead>
                <tbody>

                <tr v-for="(log, logIndex) in data.logs">

                  <td v-if="settings.showClientColumn">{{ util.join(log.clients, '') }}</td>

                  <td v-if="settings.showProjectColumn">{{ util.join(log.projects, '') }}</td>

                  <td v-if="settings.showTaskColumn">{{ util.join(log.tasks, '') }}</td>

                  <td v-if="settings.showSourceColumn">{{ util.join(log.sources, '') }}</td>
                  <td>{{ log.description || 'n/a' }}</td>

                  <td v-if="settings.showCostColumn">{{ util.formatAmount(log.cost, settings.currencyFormat) }}</td>
                  <td>{{ util.formatDuration(log.duration) }}</td>

                  <td v-if="settings.showDupeButton" class="text-end">
                    <button class="btn btn-link btn-sm btn-icon btn-dupe"
                            @click.stop.prevent="duplicateLog(dayIndex, logIndex)">
                      <DuplicateLog></DuplicateLog>
                    </button>
                  </td>
                  <td class="text-end">
                    <button class="btn btn-link btn-sm btn-icon btn-dupe"
                            @click.stop.prevent="editLog(dayIndex, logIndex)">
                      <EditLog></EditLog>
                    </button>
                  </td>
                  <td class="text-end">
                    <a class="btn btn-link btn-sm btn-icon btn-dupe"
                       @click.stop.prevent="deleteLog(dayIndex, logIndex)">
                      <DeleteLog></DeleteLog>
                    </a>
                  </td>
                </tr>

                </tbody>
                <tfoot>
                <tr>
                  <td :colspan="totalCellColspan()"></td>
                  <td v-if="settings.showCostColumn" v-html="util.formatCost(dayTotalCost(data.logs), settings.currencyFormat, settings.tax, settings.rateIncludesTax)">
                  </td>
                  <td>{{ util.formatDuration(dayTotalTime(data.logs)) }}</td>
                  <td :colspan="settings.showDupeButton ? 3 : 2"></td>
                </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </template>
      </div>
    </div>
    <DownloadDialog :table-data="tableData" ref="downloadDialog"></DownloadDialog>
    <FilterDialog :table-data="tableData" :suggestion-provider="suggestionProvider" ref="filterDialog"
                  v-on:update-filters="setFilters"></FilterDialog>
  </div>

</template>

<script>
import {TimelogStore} from "@/classes/TimelogStore";
import {TimelogParser} from "@/classes/TimelogParser";
import {SuggestionProvider} from "@/classes/SuggestionProvider";
import DuplicateLog from "@/components/icons/DuplicateLog.vue";
import EditLog from "@/components/icons/EditLog.vue";
import DeleteLog from "@/components/icons/DeleteLog.vue";
import DotsVertical from "@/components/icons/DotsVertical.vue";
import ChevronLeft from "@/components/icons/ChevronLeft.vue";
import ChevronRight from "@/components/icons/ChevronRight.vue";
import DownloadDialog from "@/components/DownloadDialog.vue";
import FilterDialog from "@/components/FilterDialog.vue";
import CloseButton from "@/components/icons/CloseButton.vue";

export default {
  inject: ['util', 'globalStore', 'settings'],
  components: {
    CloseButton,
    DownloadDialog, ChevronRight, ChevronLeft, DotsVertical, DeleteLog, EditLog, DuplicateLog, FilterDialog
  },
  props: {
    logStore: TimelogStore,
    logParser: TimelogParser,
    suggestionProvider: SuggestionProvider
  },
  data() {
    const initRange = this.util.dateRange('week', this.util.formatDate(new Date()));

    return {
      isFiltered: false,
      filters: {},
      dateMode: 'week',
      fromDate: initRange.lowerUS,
      toDate: initRange.upperUS,
      nextDate: initRange.next,
      prevDate: initRange.prev,
      tableData: this.logStore.get(initRange.lower, initRange.upper, {}),
      extrasOpen: false,
      skipNextToWatch: false,
      prefixPropertyMap: {
        "clients": "@",
        "tasks": "#",
        "projects": "%",
        "sources": "/",
      }
    };
  },

  watch: {
    fromDate: function () {
      if(this.dateMode === 'week'){
        //set date to first of week
        let currentStart = new Date(this.fromDate),
            day = currentStart.getDay();
        if(day !== 1){
          currentStart.setDate( currentStart.getDate() + (day === 0 ? -6 : 1 - day) );
        }
        this.fromDate = this.util.formatDate(currentStart);
        this.toDate = this.util.formatDate(currentStart.setDate(currentStart.getDate() + 7));
      }
      else if(this.dateMode === 'month'){
        let date = new Date(this.fromDate);

        date.setDate(1);
        this.fromDate = this.util.formatDate(date);

        date.setMonth(date.getMonth() + 1);
        date.setHours(-6);

        this.toDate = this.util.formatDate(date);
      }
    }
  },

  methods: {
    changeDateMode() {
      if (this.dateMode !== 'custom') {
        this.gotoDate(new Date());
        return;
      }
      let start = new Date(),
          end;
      start.setDate(1);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setHours(-1);

      this.fromDate = this.util.formatDate(start);
      this.toDate = this.util.formatDate(end);
      this.updateTableData();

    },

    setFilters(filters) {
      this.filters = filters;
      this.isFiltered = Object.values(filters).some(item => item.length > 0);
      this.updateTableData();
    },

    gotoDate(date) {

      const newRange = this.util.dateRange(this.dateMode, this.util.formatDate(new Date(date)));
      this.fromDate = newRange.lowerUS;
      this.toDate = newRange.upperUS;
      this.nextDate = newRange.next;
      this.prevDate = newRange.prev;
      this.updateTableData();
    },

    updateTableData() {
      if (this.fromDate === '' && this.toDate !== '') {
        this.fromDate = this.toDate;
      }

      if (this.fromDate !== '' && this.toDate === '') {
        this.toDate = this.fromDate;
      }

      const lower = new Date(this.fromDate);
      const upper = new Date(this.toDate);
      if (lower > upper) {
        this.toDate = this.fromDate;
      }


      this.tableData = this.logStore.get(new Date(this.fromDate), new Date(this.toDate), this.filters);

    },

    totalCellColspan() {
      //make computed?!
      return 1 + +this.settings.showClientColumn
          + +this.settings.showProjectColumn
          + +this.settings.showTaskColumn
          + +this.settings.showSourceColumn;
    },

    dayTotalTime(logs) {
      return logs.reduce((total, log) => {
        return total + log.duration
      }, 0)
    },

    dayTotalCost(logs) {
      return logs.reduce((total, log) => {
        return total + this.util.costFromRate(log.duration, log.rate)
      }, 0)
    },

    totalTime() {
      return this.tableData.days.reduce((total, day) => {
        return total + day.total;
      }, 0)
    },

    totalCost() {
      return this.tableData.days.reduce((total, day) => {
        return total + day.cost;
      }, 0)
    },

    deleteLog(dayIndex, logIndex) {
      this.logStore.delete(this.tableData.days[dayIndex].logs[logIndex]);
      this.updateTableData();
      this.$emit('hide-suggestions');
      this.globalStore.toast('log deleted...')
    },
    duplicateLog(dayIndex, logIndex) {


      this.logStore.insert(this.logParser.parse(this.tableData.days[dayIndex].logs[logIndex].normalized.replace(/^~[a-f0-9 ]*/, '')));
      this.updateTableData();
      this.$emit('hide-suggestions');
      this.globalStore.toast('log duplicated...')
    },
    editLog(dayIndex, logIndex) {
      this.$emit('edit-log', this.tableData.days[dayIndex].logs[logIndex]);
    },
  }
}
</script>

<style>
#toggle-extras svg {
  width: 80%;
}

input[type="date"] {
  max-width: 100px;
  padding: 0;
}

input[type="date"]:read-only {
  /*

  max-width:80px;
  opacity:0.5;
   */
}


input[type="date"]::-webkit-calendar-picker-indicator {
  margin: 0;
}
</style>
