<template>
  <TabContent :name="'dateparse'" :view="view">

    <h3 class="fw-light">Dates</h3>
    <p>Dates are parsed from the configured date format (<code>{{ parser.options.dateFormat }}</code>) and several
      shortcuts:</p>
    <table class="table duration-examples">
      <thead>
      <tr>
        <th>value</th>
        <th>parsed date</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(date, i) in dates">
        <td><code>{{ date }} {{ date === '' ? '(empty)' : '' }}</code></td>
        <td>
          {{ util.formatDate(parser.dateTimeHelper.parseDate(date, parser.options.dateFormat), parser.options.dateFormat) }}
        </td>
      </tr>
      </tbody>
    </table>

    <h3 class="fw-light">Durations</h3>
    <p>Durations are parsed to minutes and displayed in <code>hh:mm</code> format:</p>
    <table class="table duration-examples">
      <thead>
      <tr>
        <th>value</th>
        <th>parsed minutes</th>
        <th>hh:mm</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(duration, i) in durations">
        <td><code>{{ duration }} {{ duration === '' ? '(empty)' : '' }}</code></td>
        <td>{{ parser.dateTimeHelper.parseDuration(duration, dd, ht) }}</td>
        <td>{{ util.formatDuration(parser.dateTimeHelper.parseDuration(duration, dd, ht)) }}</td>
      </tr>
      </tbody>
    </table>

  </TabContent>
</template>

<script>
import TabContent from "./TabContent.vue";
import {TimelogParser} from "@/classes/TimelogParser";


export default {
  name: "DateparseContent",
  components: {TabContent},
  inject: ['util'],
  props: {
    view: String,
    parser: TimelogParser
  },
  data() {
    return {
      dd: this.parser.options.defaultDuration,
      ht: this.parser.options.hourThreshold,
      durations: [
        '',
        '+1.06',
        '+1:05',
        '+1:50',
        '+0:30',
        '+0.5',
        '+10',
        '+2',
        '+2.5',
        '+2:30',
        '+10',
        '+.5',
        '+45'
      ],
      dates: [
        '',
        ':t',
        ':today',
        ':y',
        ':yesterday',
        ':05',
        ':5',
        ':50',
        ':-1',
        ':-3',
        ':+1',
        ':+2',
        ':mon',
        ':fri',
        ':lastwed',
        ':nexttue',
        ':' + this.parser.dateTimeHelper.convertFormattedString('22.01', 'dd.mm.yyyy', this.parser.options.dateFormat).slice(0, -5),
        ':' + this.parser.dateTimeHelper.convertFormattedString('11.12', 'dd.mm.yyyy', this.parser.options.dateFormat).slice(0, -5),
        ':' + this.parser.dateTimeHelper.convertFormattedString('10.03.2022', 'dd.mm.yyyy', this.parser.options.dateFormat),
      ]

    }
  }
}
</script>
