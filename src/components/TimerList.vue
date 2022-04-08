<template>
  <div :key="refreshKey">
    <div class="alert mt-3 p-2 d-flex justify-content-between"
         :class="{'alert-info' : timer.state === 'running', 'alert-warning' : timer.state !== 'running'}"
         v-for="(timer, index) in timers.timers">

      <div>

        <strong class="me-1">{{
            util.formatDuration(timer.state === 'running' ? (timers.duration(timer.started) + timer.minutes) : timer.minutes)
          }}</strong>


        <span class="me-1" v-if="timer.timelog.clients.length > 0">{{ util.join(timer.timelog.clients, '@') }} </span>
        <span class="me-1" v-if="timer.timelog.projects.length > 0">{{ util.join(timer.timelog.projects, '%') }} </span>
        <span class="me-1" v-if="timer.timelog.tasks.length > 0">{{ util.join(timer.timelog.tasks, '#') }} </span>
        <span class="me-1" v-if="timer.timelog.sources.length > 0">{{ util.join(timer.timelog.sources, '/') }} </span>
        <span class="me-1" v-if="timer.timelog.description.length > 0">{{ timer.timelog.description }} </span>
        <strong class="me-1"
                v-if="settings.showCostColumn">{{
            util.formatAmount(util.costFromRate((timers.duration(timer.started) + timer.minutes), timer.timelog.rate), settings.currencyFormat)
          }} </strong>
      </div>


      <div class="btn-group" role="group" :class="{'pulse' : timer.state === 'running'}">

        <button class="btn py-1 btn-icon"
                :class="{'btn-outline-info' : timer.state === 'running', 'btn-outline-warning' : timer.state !== 'running'}"
                @click.stop.prevent="timers.toggle(index)">
          <PauseButton v-if="timer.state === 'running'"></PauseButton>
          <PlayButton v-else></PlayButton>
        </button>
        <button class="btn py-1 btn-icon"
                :class="{'btn-outline-info' : timer.state === 'running', 'btn-outline-warning' : timer.state !== 'running'}"
                @click.stop.prevent="$emit('end-timer', timers.end(index))">
          <CheckMark></CheckMark>
        </button>
        <button class="btn py-1 btn-icon"
                :class="{'btn-outline-info' : timer.state === 'running', 'btn-outline-warning' : timer.state !== 'running'}"
                @click.stop.prevent="timers.delete(index)">
          <DeleteLog></DeleteLog>
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import {TimerCollection} from "@/classes/TimerCollection";
import {TimelogParser} from "@/classes/TimelogParser";
import PauseButton from "@/components/icons/PauseButton.vue";
import PlayButton from "@/components/icons/PlayButton.vue";
import CheckMark from "@/components/icons/CheckMark.vue";
import DeleteLog from "@/components/icons/DeleteLog.vue";

export default {
  emits: ['end-timer'],
  components: {DeleteLog, CheckMark, PlayButton, PauseButton},
  inject: ['util', 'settings'],
  props: {
    timers: TimerCollection,
    logParser: TimelogParser
  },
  data() {
    return {
      refreshKey: 0,
      timeout: null
    }
  },
  watch: {
    timers: {
      deep: true,
      handler: function () {
        if (this.timeout === null) {
          this.increaseKey();
        }
      }
    }
  },
  mounted() {
    this.timeout = setTimeout(this.increaseKey, 60000);
  },
  methods: {
    increaseKey() {
      this.refreshKey++;
      if (this.timers.timers.length > 0) {
        this.timeout = setTimeout(this.increaseKey, 60000);
      } else {
        this.timeout = null;
      }
    }
  }
}
</script>

<style>
.pulse {

  box-shadow: 0 0 0 rgba(255, 255, 255, 0.4);
  animation: pulse 2s infinite;
}

@-webkit-keyframes pulse {
  0% {
    -webkit-box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    -webkit-box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    -webkit-box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

@keyframes pulse {
  0% {
    -moz-box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
  }
  70% {
    -moz-box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    -moz-box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>