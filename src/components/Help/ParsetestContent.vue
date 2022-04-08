<template>
  <TabContent :name="'parsetest'" :view="view">

    <h3 class="fw-light">Parse Test</h3>
    <textarea ref="ta" class="form-control" v-model="logString"></textarea>
    <div class="small">
      Examples:
      <a href="#" class="me-1" v-for="(value, key) in examples" @click.stop.prevent="logString = value">{{ key }}</a>
    </div>

    <table class="table">
      <thead>
      <tr>
        <th>
          property
        </th>
        <th>
          matched
        </th>
        <th>
          is default
        </th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>
          <code>@client</code>
        </td>
        <td>
          {{ util.join(parsed.clients, '') }}
        </td>
        <td>
          {{ parsed.usesDefaultClient ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>%project</code>
        </td>
        <td>
          {{ util.join(parsed.projects, '') }}
        </td>
        <td>
          {{ parsed.usesDefaultProject ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>#task</code>
        </td>
        <td>
          {{ util.join(parsed.tasks, '') }}
        </td>
        <td>
          {{ parsed.usesDefaultTask ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>/source</code>
        </td>
        <td>
          {{ util.join(parsed.sources, '') }}
        </td>
        <td>
          {{ parsed.usesDefaultSource ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>+duration</code>
        </td>
        <td>
          {{ util.formatDuration(parsed.duration) }}
        </td>
        <td>
          {{ parsed.usesDefaultDuration ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>:date</code>
        </td>
        <td>
          {{ util.formatDate(parsed.timestamp, options.dateFormat) }}
        </td>
        <td>
          {{ parsed.usesDefaultDate ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>$rate</code>
        </td>
        <td>
          {{ util.formatCost(parsed.rate, options.currencyFormat) }}
        </td>
        <td>
          {{ parsed.usesDefaultRate ? 'yes' : 'no' }}
        </td>
      </tr>

      <tr>
        <td>
          <code>(cost)</code>
        </td>
        <td>
          {{ util.formatCost(util.costFromRate(parsed.duration, parsed.rate), options.currencyFormat) }}

        </td>
        <td>
          n/a
        </td>
      </tr>

      <tr>
        <td>
          <code>description</code>

        </td>
        <td>{{ parsed.description }}</td>
        <td>
          n/a
        </td>
      </tr>

      <tr>
        <td>
          <code>normalized</code>

        </td>
        <td colspan="2"><code>{{ parsed.normalized }}</code></td>

      </tr>
      <tr>
        <td>
          <code>is timer</code>

        </td>
        <td colspan="2"><code>{{ parsed.isTimer ? 'yes' : 'no' }}</code></td>

      </tr>

      </tbody>
    </table>

  </TabContent>
</template>

<script>
import TabContent from "./TabContent.vue";
import {TimelogParser} from "@/classes/TimelogParser";


export default {
  name: "ParsetestContent",
  components: {TabContent},
  inject: ['util'],
  props: {
    view: String,
    parser: TimelogParser
  },
  data() {
    return {
      options: this.parser.options,
      logString: '',
      parsed: this.parser.decoratedParse(''),
      examples: {
        'empty': '',
        'full': '@acme %relaunch #support /jira:ACRL-1842 +93 :-2 $99 summarize how aspect ratio works',
        'sparse': '@acme #support /phone determine how many edges a rectangle has',
        'multi': '@acme @designcompany #concept #planning %relaunch %refactoring :-2 +3 discuss framework upgrade',
      }
    }
  },
  watch: {
    logString: function () {
      this.parsed = this.parser.decoratedParse(this.logString);
    }
  }
}
</script>
