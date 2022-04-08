<template>
  <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x" style="z-index: 8192;">
    <template v-for="toast in globalStore.toasts">
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <strong class="me-auto">{{toast.title}}</strong>
        </div>
        <div class="toast-body" v-if="toast.body">{{toast.body}}</div>
      </div>
    </template>
  </div>
</template>
<script>
export default {
  inject:['globalStore'],
  name : 'ToastBox'
}
</script>