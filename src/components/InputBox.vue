<template>

  <div class="row">

    <div class="col-12">
      <div class="row g-0">
        <div class="col-9 col-xl-10 ">

          <div class="position-relative ">
                            <textarea class="form-control form-control-lg" :placeholder="placeholder" id="timelog"
                                      style="height: 100px" ref="textarea" @keydown="keyDown($event)"
                                      @keyup="keyUp($event)" v-model="logString"></textarea>
            <button v-if="settings.showHelpIcon" class="btn btn-icon position-absolute end-0 top-0"
                    @click="$emit('show-help')">
              <QuestionMark></QuestionMark>
            </button>
          </div>
        </div>
        <div class="col-3 col-xl-2">
          <!--
          <button id="storeButton" class="btn btn-info w-100 h-75" title="ctrl + enter"
                  @click.stop.prevent="storeCurrentLog">store
          </button>
          -->

          <div class="btn-group w-100 h-100">
            <button id="storeButton" type="button" class="btn btn-info w-100 h-100" title="ctrl + enter"
                    @click.stop.prevent="storeCurrentLog">
              <span class="d-none d-lg-inline fs-4">Store</span>
              <span class="d-lg-none">Store</span>
            </button>
            <button type="button" class="btn btn-info dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown"
                    aria-expanded="false">
              <span class="visually-hidden">Toggle Dropdown</span>
            </button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#" @click.prevent.stop="setTimer">Start timer</a></li>
            </ul>
          </div>


        </div>
        <div class="col-12">
          <p class="small mb-0" v-html="previewString" v-if="logString.length > 0"></p>
          <div class="position-relative">

            <ul class="list-group position-absolute top-100 w-100" style="z-index:999">
              <li class="list-group-item list-group-item-action"
                  v-for="(suggestion, index) in suggestions"
                  @click.stop.prevent="insertSuggestion"
                  :class="{active : index === suggestionIndex}">{{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {TimelogParser} from "@/classes/TimelogParser";
import {TimelogStore} from "@/classes/TimelogStore";
import {SuggestionProvider} from "@/classes/SuggestionProvider";
import QuestionMark from "@/components/icons/QuestionMark.vue";
import {TimerCollection} from "@/classes/TimerCollection";

export default {
  components: {QuestionMark},
  inject: ['util', 'globalStore', 'settings'],
  props: {
    parser: TimelogParser,
    logStore: TimelogStore,
    suggestionProvider: SuggestionProvider,
    timers: TimerCollection
  },
  data() {
    return {
      inputIsMultiple: false,
      inputIsMultipleExtend: false,
      currentLog: null,
      placeholder: '',
      previewString: '',
      logString: '',
      suggestMatcher: /([@|#|\/|%])([a-z0-9:_-]{1,})$/mi,
      suggestions: [],
      suggestionIndex: 0,
      currentSuggestFragment: null,
      prefixes: {
        '@': 'clients', '#': 'tasks', '%': 'projects', '/': 'sources'
      }

    }
  },
  mounted() {
    this.setPlaceholder()
  },
  watch: {
    logString: function (nv, ov) {

      this.inputIsMultipleExtend = nv.indexOf('****') > -1

      this.inputIsMultiple = nv.indexOf('----') > -1;
    }
  },
  methods: {
    setPlaceholder() {
      const placeholders = [
        'what\'s poppin\' kermit?',
        'what do?',
        'what have you been up to?',
        'what\'s happening?',
        '⌚🤔',
        'do you remember anything at all?',
        'any recollection?',
        'think...',
        'something something video call'
      ];

      this.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    },

    keyDown(e) {
      if (['Tab', 'Enter'].indexOf(e.key) > -1 && this.suggestions.length > 0) {
        this.insertSuggestion();
        e.preventDefault();
        return;
      }


      if (['ArrowDown', 'ArrowUp'].indexOf(e.key) > -1 && this.suggestions.length > 0) {
        const max = this.suggestions.length;
        let newIndex = parseInt(this.suggestionIndex);
        if (e.key === 'ArrowDown') {
          newIndex++;
          if (newIndex >= max) {
            newIndex = 0;
          }
        } else {
          newIndex--;
          if (newIndex < 0) {
            newIndex = max - 1;
          }
        }

        this.suggestionIndex = newIndex;
        e.preventDefault();
      }
    },


    keyUp(e) {
      const text = this.logString,
          selectionStart = this.$refs.textarea.selectionStart,
          textToCursor = text.substr(0, selectionStart),
          lastIndexOfSpace = Math.max(textToCursor.lastIndexOf(' '), 0),
          textBeforeCursor = textToCursor.substr(lastIndexOfSpace, selectionStart),
          matches = textBeforeCursor.match(this.suggestMatcher);


      if (e.key === 'Enter' && e.ctrlKey && this.settings.storeOnControlEnter) {
        this.storeCurrentLog();
        return;
      }

      if (['ArrowDown', 'ArrowUp'].indexOf(e.key) > -1 && null !== this.currentSuggestFragment) {
        return;
      }

      if (matches) {
        this.suggestionIndex = 0;
        this.currentSuggestFragment = matches[2];
        this.suggestions = this.suggestionProvider.get(this.prefixes[matches[1]], matches[2]);
      } else {
        this.unsetSuggestions();
      }

      this.setPreview();
    },

    setPreview() {

      if (this.settings.showParsePreviewOnType) {

        const logs = this.logString.split(/----|\*\*\*\*/);

        const parsed = this.parser.decoratedParse(logs[0], this.settings.defaultDateInsideSelection ? this.globalStore.defaultDate : false);
        this.previewString = `
                <span class="${this.currentLog ? 'd-none' : ''}">Preview:</span>
                <span class="${this.currentLog ? 'text-info' : 'd-none'}">Editing:</span>
                <span class="${parsed.clients.length === 0 ? 'd-none' : ''} ${parsed.usesDefaultClient ? 'fst-italic' : ''}">${this.util.join(parsed.clients, '@')}</span>
                <span class="${parsed.projects.length === 0 ? 'd-none' : ''} ${parsed.usesDefaultProject ? 'fst-italic' : ''}">${this.util.join(parsed.projects, '%')}</span>
                <span class="${parsed.tasks.length === 0 ? 'd-none' : ''} ${parsed.usesDefaultTask ? 'fst-italic' : ''}">${this.util.join(parsed.tasks, '#')}</span>
                <span class="${parsed.sources.length === 0 ? 'd-none' : ''} ${parsed.usesDefaultSource ? 'fst-italic' : ''}">${this.util.join(parsed.sources, '/')}</span>
                <span class="${parsed.usesDefaultDuration ? 'fst-italic' : ''}">${this.util.formatDuration(parsed.duration)}</span>
                <span class="${parsed.usesDefaultDate ? 'fst-italic' : ''}">${this.util.formatDate(parsed.timestamp, this.settings.dateFormat)}</span>
                <span>${parsed.description}</span>
            `;

        if (logs.length > 1) {
          this.previewString += `<span class="fw-bold">and ${logs.length - 1} more</span>`
        }
      }
    },

    afterProcessing() {
      if (this.settings.clearTimeLogOnStore) {
        this.logString = '';
        this.previewString = null;
        this.currentLog = false;
        this.inputIsMultiple = false;
        this.inputIsMultipleExtend = false;
      }


      this.$emit('reload-table');
      this.$emit('after-insert');
      this.setPlaceholder();
      this.unsetSuggestions();
    },

    setTimer() {
      let logStrings = this.logString.split('----');
      if (logStrings[0].trim().length === 0) {
        return;
      }

      logStrings.forEach(log => {
        let parsedLog = this.parser.parse(log);
        this.timers.setTimer(parsedLog);
      });

      this.globalStore.toast(`timer created...`)
      this.afterProcessing();
    },

    storeCurrentLogAsMultipleExtend() {
      const logStrings = this.logString.split('****');
      const extended = this.parser.extend(logStrings[0], logStrings.slice(1), {
        normalized: true,
        includeSource: true,
        stripHash: true,
        defaultDate: this.settings.defaultDateInsideSelection ? this.globalStore.defaultDate : false
      });

      this.logString = extended.join('----');
      console.log(this.logString);
      this.storeCurrentLogAsMultiple();
    },

    storeCurrentLogAsMultiple() {
      if (this.logString.length === 0) {
        return;
      }

      let logStrings = this.logString.split('----'),
          logInserts = 0,
          logInsertsOutOfRange = 0,
          timerInserts = 0;

      logStrings.forEach(log => {

        if (log.trim().length === 0) {
          return;
        }

        let parsedLog = this.parser.parse(log, false, this.settings.defaultDateInsideSelection ? this.globalStore.defaultDate : false);

        if (/&\s*$/.test(log)) {
          this.timers.setTimer(parsedLog);
          this.suggestionProvider.updateFromLog(parsedLog);
          timerInserts++;
        } else {
          this.logStore.insert(parsedLog);
          this.suggestionProvider.updateFromLog(parsedLog);

          let nd = new Date(parsedLog.timestamp);
          if(nd < this.globalStore.lowerDate || nd > this.globalStore.upperDate){
            logInsertsOutOfRange++;
          }

          logInserts++;
        }

      })


      if (logInserts > 0 && logInserts - logInsertsOutOfRange > 0) {
        this.globalStore.toast(`${logInserts - logInsertsOutOfRange} logs saved...`)
      }

      if(logInsertsOutOfRange > 0){
        this.globalStore.toast(`${logInsertsOutOfRange} logs saved outside of current date range...`)
      }

      if (timerInserts > 0) {
        this.globalStore.toast(`${timerInserts} timers created...`)
      }


      this.afterProcessing();

    },

    applyHistoryExpansions() {
      const splitter = /----/.test(this.logString) ? '----' : '****';
      this.logString = this.logString.split(splitter)
          .map(log => {
            const index = log.match(/^!!?(\d+)/);
            const hash = log.match(/^!!?([a-f0-9]{2,})/);
            const forceDefaultDateOnDateless = log.slice(0,2) !== '!!';

            let sourceLog = null;
            if (!!index && !hash) {
              const actualIndex = parseInt(index[1]) - 1;
              const mapping = this.logStore.currentSelection.indexToLogMap[actualIndex];
              if (mapping && this.logStore.currentSelection.days[mapping[0]] && this.logStore.currentSelection.days[mapping[0]].logs[mapping[1]]) {
                sourceLog = this.logStore.currentSelection.days[mapping[0]].logs[mapping[1]];
                log = log.replace(/^!!?\d+\s*/, '');
              }
            }

            if(!!hash){
              const hfl = hash[1].length;
              sourceLog = this.logStore.data.find(l => l.hash.slice(0, hfl) === hash[1]);
              if(sourceLog){
                log = log.replace(/^!!?([a-f0-9]{2,})/, '');
              }
            }

            if(sourceLog){
              log = this.parser.extend(sourceLog,
                  log,
                  {
                    normalized: true,
                    includeSource: false,
                    stripHash: true,
                    defaultDate: this.settings.defaultDateInsideSelection ? this.globalStore.defaultDate : false,
                    forceDefaultDateOnDateless
                  }
              );

            }
            return log;
          }).join(splitter);
    },

    storeCurrentLog() {
      if (this.logString.length === 0) {
        return;
      }

      this.applyHistoryExpansions();

      if (!this.currentLog && this.inputIsMultipleExtend) {
        this.storeCurrentLogAsMultipleExtend();
        return;
      }

      if (!this.currentLog && this.inputIsMultiple) {
        this.storeCurrentLogAsMultiple();
        return;
      }

      if (/&\s*$/.test(this.logString)) {
        this.setTimer()
        return;
      }

      let parsedLog;

      if (this.currentLog) {
        parsedLog = this.parser.parse(this.logString);
        if (parsedLog.timestamp !== this.currentLog.timestamp) {
          if (!this.settings.keepOriginalLogOnEdit) {
            this.logStore.delete(this.currentLog);
          }
          this.logStore.insert(parsedLog);
        } else {
          parsedLog = this.parser.parse(this.logString, this.currentLog.hash);
          this.logStore.update(parsedLog);
        }
        this.globalStore.toast('log updated...')
      } else {
        parsedLog = this.parser.parse(this.logString, false, this.settings.defaultDateInsideSelection ? this.globalStore.defaultDate : false);
        this.logStore.insert(parsedLog);

        let nd = new Date(parsedLog.timestamp);
        if(nd < this.globalStore.lowerDate || nd > this.globalStore.upperDate){
          this.globalStore.toast('log saved outside of current date range...')
        }else{
          this.globalStore.toast('log saved...')
        }
      }
      this.suggestionProvider.updateFromLog(parsedLog)


      this.afterProcessing();
    },


    insertSuggestion() {
      const text = this.logString,
          selectionStart = this.$refs.textarea.selectionStart,
          substr = text.substr(0, selectionStart),
          replaced = substr.replace(
              new RegExp(this.currentSuggestFragment + '$'),
              this.suggestions[this.suggestionIndex] + ' '
          ),
          diff = replaced.length - substr.length;

      this.suggestions = [];
      this.suggestionIndex = 0;
      this.currentSuggestFragment = null;

      this.logString = text.replace(substr, replaced);
      this.$refs.textarea.selectionStart = selectionStart + diff;
      this.$refs.textarea.selectionEnd = selectionStart + diff;
      this.$refs.textarea.focus();

      this.setPreview();
    },


    unsetSuggestions() {
      this.suggestionIndex = 0;
      this.currentSuggestFragment = null;
      this.suggestions = [];
    },

    editLog(log) {
      this.unsetSuggestions();
      this.currentLog = log;
      this.logString = this.currentLog.normalized.replace(/^~[a-f0-9 ]*/, '');

      this.logString = this.parser.dateTimeHelper.convertFormattedDateInString(this.logString, 'yyyy-mm-dd', this.settings.dateFormat);

      this.$refs.textarea.focus();
      this.$nextTick(() => {
        this.setPreview();
      })
    }
  }
}
</script>

<style scoped>
textarea {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

#storeButton {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

</style>