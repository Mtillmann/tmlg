<template>
  <li class="nav-item" role="presentation">
    <button class="nav-link" :id="`${name}-tab`" type="button"
            role="tab" :aria-controls="`${name}TabsPane`" :class="{active : view === name}"
            :aria-selected="view === name"
            @click="$emit('set-view', name)"><slot></slot>
    </button>
  </li>
</template>

<script>
export default {
  name : 'TabButton',
  props : {
    name : String,
    view : String
  }
}
</script>