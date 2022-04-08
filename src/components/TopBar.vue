<template>
  <div class="container">
    <div class="row">
      <div class="col-12 d-flex justify-content-between">
        <h1 class="fw-lighter"><kbd>TMLG</kbd></h1>
        <a href="#" class="h-100 d-block show-menu btn btn-icon" data-bs-toggle="offcanvas"
           data-bs-target="#offcanvasControls" aria-controls="offcanvasControls">
            <MenuToggle></MenuToggle>
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import MenuToggle from "@/components/icons/MenuToggle.vue";
export default {
  components: {MenuToggle}
}
</script>