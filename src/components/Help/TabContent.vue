<template>
  <div class="tab-content mt-3" :id="`${name}TabsContent`">
    <div class="tab-pane fade" :class="{active : view === name, show : view === name}" :id="`${name}TabsPane`"
         role="tabpanel" :aria-labelledby="`${name}-tab`">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name : 'TabContent',
  props : {
    name : String,
    view : String
  }
}
</script>