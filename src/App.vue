<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import Read from './Read/index.vue'
import Write from './Write/index.vue'

const route = ref('')
const enterAction = ref({})

onMounted(() => {
  const utools = window.utools
  if (utools?.onPluginEnter && utools.onPluginOut) {
    utools.onPluginEnter((action) => {
      route.value = action.code
      enterAction.value = action
    })
    utools.onPluginOut(() => {
      route.value = ''
    })
  } else {
    route.value = 'read'
  }
})
</script>

<template>
  <n-message-provider>
    <template v-if="route === 'read'">
      <Read :enterAction="enterAction" />
    </template>
    <template v-if="route === 'write'">
      <Write :enterAction="enterAction" />
    </template>
  </n-message-provider>
</template>
