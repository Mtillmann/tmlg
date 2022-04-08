<template>

  <div class="modal fade" ref="modal" id="helpHowTo" data-bs-backdrop="static" data-bs-keyboard="false"
       tabindex="-1" aria-labelledby="helpHowToLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-md-down">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title fw-light" id="helpHowToLabel">Help &amp; Howto
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">


          <ul class="nav nav-tabs" id="helpTabs" role="tablist">
            <TabButton :name="'help'" :view="view" @set-view="setView">Syntax</TabButton>

            <TabButton :name="'dateparse'" :view="view" @set-view="setView">Date and Duration</TabButton>

            <TabButton :name="'synchronization'" :view="view" @set-view="setView">Synchronization</TabButton>

            <TabButton :name="'parsetest'" :view="view" @set-view="setView">Parse Test</TabButton>
          </ul>

          <SyntaxContent :view="view" @set-view="setView" :parser="parser"></SyntaxContent>
          <DateparseContent :view="view" :parser="parser"></DateparseContent>
          <SyncContent :view="view"></SyncContent>
          <ParsetestContent :view="view" :parser="parser"></ParsetestContent>


        </div>
      </div>
    </div>
  </div>

</template>

<script>
import {Modal} from "bootstrap";
import SyntaxContent from "@/components/Help/SyntaxContent.vue";

import TabButton from "@/components/Help/TabButton.vue";
import SyncContent from "@/components/Help/SyncContent.vue";
import DateparseContent from "@/components/Help/DateparseContent.vue";
import {TimelogParser} from "@/classes/TimelogParser";
import ParsetestContent from "@/components/Help/ParsetestContent.vue";



export default {
  name: "HelpDialog",
  components: {ParsetestContent, DateparseContent, SyncContent, TabButton, SyntaxContent},
  props: {
    parser: TimelogParser
  },
  data() {
    return {
      modal: null,
      view: 'help',
    }
  },
  mounted() {
    this.modal = new Modal(this.$refs.modal);
  },
  methods: {
    show(view = 'help') {
      this.view = view;
      this.modal.show();
    },
    setView(view) {
      this.view = view;
    }
  }
}
</script>

<style scoped>

</style>