<template>
  <Transition name="fade">
    <div class="position-fixed top-0 start-0 vh-100 vw-100" style="z-index:4096" v-if="globalStore.loading">
      <div class="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
      <div class="position-absolute top-50 start-50 translate-middle px-4 py-2 rounded-3 bg-light shadow">
        <h1 class="fw-light display-1">📼</h1>
      </div>
    </div>
  </Transition>
</template>
<script>
export default {
  inject:['globalStore'],
  name : 'LoadingModal'
}
</script>