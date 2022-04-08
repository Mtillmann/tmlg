<template>
  <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasControls" aria-labelledby="offcanvasControlsLabel">
    <div class="offcanvas-header pb-2 pb-lg-3">
      <h5 class="offcanvas-title" id="offcanvasControlsLabel"><!--Navigation--></h5>
      <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>
    <div class="offcanvas-body pt-0 pt-lg-3">
      <div class="list-group list-group-flush mb-2 pb-2 border-bottom">
        <a href="#" class="list-group-item list-group-item-action" @click.stop.prevent="$emit('show-settings')">Settings</a>
      </div>
      <div class="list-group list-group-flush mb-2 pb-2 border-bottom">
        <a href="#" class="list-group-item list-group-item-action" @click.stop.prevent="$emit('show-sync-options')">Sync
          options</a>
        <a href="#" class="list-group-item list-group-item-action" :class="{disabled : !sync.hasCredentials}" @click.stop.prevent="$emit('sync-now')">Sync Now</a>
        <a href="#" class="list-group-item list-group-item-action"
           @click.stop.prevent="$emit('inspect-data')">Inspect
          Sync Data</a>
      </div>
      <div class="list-group list-group-flush">

        <!--
        <a href="#" class="list-group-item list-group-item-action">RESET</a>
        -->
        <a href="#" class="list-group-item list-group-item-action" @click.stop.prevent="$emit('show-import-dialog')">Import
          / Export</a>

        <a href="#" class="list-group-item list-group-item-action" @click.stop.prevent="$emit('show-help-dialog')">Help &amp; Howto</a>

      </div>

    </div>
  </div>
</template>
<script>
import {PiggyBackSync} from "@/classes/PiggyBackSync";

export default {
  props : {
    sync: PiggyBackSync
  }
}
</script>