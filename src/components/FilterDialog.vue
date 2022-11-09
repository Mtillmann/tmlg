<template>
  <div
      class="modal fade"
      ref="modal"
      id="filters"
      data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="filtersLabel"
      aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="filtersLabel">Filters</h5>
          <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">


          <div class="accordion" id="filterAccordion">
            <template v-for="(filterKey, i) in filterKeys">
              <div class="accordion-item"
                   v-if="suggestionProvider.data[filterKey].length + tableData.matchedProperties[filterKey].length > 0">
                <h2 class="accordion-header" :id="`heading${i}`">
                  <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                          :data-bs-target="`#collapse${i}`"
                          aria-expanded="false" :aria-controls="`collapse${i}`">
                    {{ filterKey }} ({{ filters[filterKey].length }} /
                    {{ tableData.matchedProperties[filterKey].length }} )
                  </button>
                </h2>
                <div :id="`collapse${i}`" class="accordion-collapse collapse" :aria-labelledby="`heading${i}`"
                     data-bs-parent="#filterAccordion">
                  <div class="accordion-body">

                    <label class=" border border-primary rounded p-1 d-inline-block me-2 small"
                           v-for="(item, j) in tableData.matchedProperties[filterKey]"
                           :for="`cb-filter-current-${filterKey}-${j}`">
                      <input @change="toggleFilter(filterKey, item)"
                             :checked="filters[filterKey].indexOf(item) > -1"
                             class="form-check-input" type="checkbox" value=""
                             :id="`cb-filter-current-${filterKey}-${j}`">

                      {{ item }}

                    </label>

                    <template v-for="(item, j) in suggestionProvider.data[filterKey]">
                      <label class=" border border-primary rounded p-1 d-inline-block me-2 small"
                             v-if="tableData.matchedProperties[filterKey].indexOf(item[0]) === -1"
                             :for="`cb-filter-other-${filterKey}-${j}`">
                        <input @change="toggleFilter(filterKey, item[0])"
                               :checked="filters[filterKey].indexOf(item[0]) > -1"
                               class="form-check-input" type="checkbox" value=""
                               :id="`cb-filter-other-${filterKey}-${j}`">

                        {{ item[0] }}
                      </label>

                    </template>


                  </div>
                </div>
              </div>
            </template>


          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click.stop.prevent="clear">Clear all</button>
          <button type="button" class="btn btn-primary" @click.stop.prevent="apply">Apply filters</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import {SuggestionProvider} from "@/classes/SuggestionProvider";
import CloseButton from "@/components/icons/CloseButton.vue";
import {Modal} from "bootstrap";

export default {
  inject: ['settings'],
  components: {CloseButton},
  props: {
    suggestionProvider: SuggestionProvider,
    tableData: {},
  },
  mounted() {
    this.modal = new Modal(this.$refs.modal);
    if (this.isFiltered) {
      this.apply()
    }
  },
  data() {

    let url = new URL(window.location),
        filters = {
          clients: [],
          projects: [],
          tasks: [],
          sources: []
        },
        isFiltered = false;

    ['clients', 'projects', 'tasks', 'sources'].forEach(type => {
      if (url.searchParams.has(type)) {
        filters[type] = url.searchParams.get(type).split(',');
        isFiltered = true;
      }
    });



    return {
      filterKeys: Object.keys(filters),
      filters, isFiltered
    }
  },

  methods: {
    toggleFilter(filter, item, applyAfter = false) {


      if (this.filters[filter].indexOf(item) > -1) {
        this.filters[filter].splice(this.filters[filter].indexOf(item), 1);
      } else {
        this.filters[filter].push(item);
      }


      if (applyAfter) {
        this.apply()
      }
    },
    apply() {

      this.$emit('update-filters', this.filters);
      if (this.settings.closeFiltersOnApply) {
        this.modal.hide();
      }
    },
    clear() {
      this.filters = {
        clients: [],
        projects: [],
        tasks: [],
        sources: []
      }
      this.apply();
    }
  }
}
</script>

<style scoped>

</style>