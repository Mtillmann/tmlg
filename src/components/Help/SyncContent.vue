<template>
  <TabContent :name="'synchronization'" :view="view">
    <h3 class="fw-light">Synchronization</h3>
      <p>
        Synchronization enables time tracking across multiple devices/platforms and provides a good way to have a backup of your timelogs in the cloud.
      </p>
      <p>
        Data is stored with strong encryption (AES-GCM) and no server side data processing whatsoever. The synchronization of your data
        across devices is handled by each device independently, so differences in the order of timelogs within a day might occur.
      </p>
      <p>
        Online storage currently piggybacks off <a href="https://www.xbrowsersync.org/" target="_blank" rel="noopener">xBrowserSync's</a> API servers
        but you can create your own instance using their <a href="https://github.com/xbrowsersync/api" target="_blank" rel="noopener">API code</a>.
      </p>

    <p>
        Please make sure you use a good and <u>unique</u> password, since there is no way to recover the password in case you lose it. The password
      will be stored in <u>plain text</u> in your browser's local storage which is accessible by anyone who has access to your device,
      so make that you do NOT use it for any other service.
      </p>

    <p>
      Synchronization relies on built-in features of the browser (Cryptography, Compression) that may not be available in certain engines or older versions.
      Some Chromium-based browser with a current build number is recommended!
    </p>

  </TabContent>
</template>

<script>
import TabContent from "./TabContent.vue";
export default {
  name: "SyncContent",
  components: {TabContent},
  props : {
    view : String
  }
}
</script>
