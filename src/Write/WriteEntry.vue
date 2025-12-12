<script lang="ts" setup>
import Write from "./index.vue";

defineProps({
  enterAction: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <n-message-provider>
    <Write :enterAction="enterAction" />
  </n-message-provider>
</template>

