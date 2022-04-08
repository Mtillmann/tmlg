<template>
  <TabContent :name="'help'" :view="view">

    <h3 class="fw-light">Timelog Syntax</h3>
    <p>Timelog properties are attached by using certain prefix characters.
      Properties will be suggested ordered by how often they are used.
    </p>
    <p>On a device with physical
      keyboard, use <kbd>up</kbd> and <kbd>down</kbd> to navigate the suggestions, <kbd>enter</kbd> or
      <kbd>tab</kbd> to insert the highlighted suggestion.</p>

    <h3><code><kbd>@</kbd>client</code></h3>
    <p>Use the <code>@</code> symbol to add one or more clients to a timelog.
      Clients will be suggested based on past timelogs.
      You can toggle the <code>client</code>-column in the settings and set a default
      client to be used when no client is given.</p>

    <h3><code><kbd>%</kbd>project</code></h3>
    <p>Use the <code>%</code> symbol to add one or more projects to a timelog.
      Projects will be suggested based on past timelogs.
      You can toggle the <code>project</code>-column in the settings and set a default
      project to be used when no project is given.</p>

    <h3><code><kbd>#</kbd>task</code></h3>
    <p>Use the <code>#</code> symbol to add one or more tasks to a timelog.
      Tasks will be suggested based on past timelogs.
      You can toggle the <code>tasks</code>-column in the settings and set a default
      task to be used when no task is given.</p>

    <h3><code><kbd>/</kbd>source</code></h3>
    <p>Use the <code>/</code> symbol to add one or more sources to a timelog.
      Sources will be suggested based on past timelogs.
      You can toggle the <code>sources</code>-column in the settings and set a default
      source to be used when no source is given.</p>

    <h3><code><kbd>+</kbd>1:30</code> (duration)</h3>
    <p>Use the <code>+</code> symbol to add a duration to the timelog.
      When omitted, the default duration setting will be used. When you give
      a single digit value below the <code>hourThreshold</code> setting, the
      input will be converted to hours.
      You can toggle the <code>duration</code>-column in the settings.</p>


    <h3><code><kbd>:</kbd>{{ dateExample }}</code> (date)</h3>
    <p>Use the <code>:</code> symbol to add a date to the timelog.
      When omitted, the current date setting will be used. There are several shortcuts like <code>:-2</code>,
      <code>:lasttue</code>.
    </p>


    <p> <a href="#" @click.stop.prevent="$emit('set-view','dateparse')">More on Date and Duration</a></p>


    <h3><code><kbd>$</kbd>1234</code> (rate)</h3>
    <p>Use the <code>$</code> symbol to add a custom rate to the timelog.
      When omitted, the default rate setting will be used.
      You can toggle the <code>cost</code>-column in the settings.</p>

    <h3 class="fw-light">Everything else</h3>
    <p>Everything that isn't matched as as property is considered as description and will be used as such.</p>

    <p> <a href="#" @click.stop.prevent="$emit('set-view','parsetest')">Explore parser behaviour</a></p>

    <h3 class="fw-light">Multiple Logs</h3>
    <p>User <kbd>----</kbd> (4x dash) to separate multiple logs. On store, each timelog will be created individually.</p>

    <h3 class="fw-light">Timers<kbd>&amp;</kbd></h3>
    <p>
      Add an <code>&amp;</code> at the end of a timelog to create timer instead of storing the timelog instantly.
      <br>
      Timers are not synced!
    </p>

  </TabContent>
</template>

<script>
import TabContent from "./TabContent.vue";
import {TimelogParser} from "@/classes/TimelogParser";
export default {
  inject:['util'],
  name: "SyntaxContent",
  components: {TabContent},
  props : {
    parser: TimelogParser,
    view : String
  },data(){
    return {
      dateExample : this.parser.dateTimeHelper.formatDate(new Date(), this.parser.options.dateFormat).slice(0,-5)
    }
  }
}
</script>

<style scoped>

</style>