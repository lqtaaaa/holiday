<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref } from 'vue';
import Read from './Read/index.vue'
import { getUtools } from './utils/utools'

const WriteEntry = defineAsyncComponent(() => import("./Write/WriteEntry.vue"))

const route = ref('')
const enterAction = ref({})

onMounted(() => {
  const utools = getUtools()
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
  <template v-if="route === 'read'">
    <Read :enterAction="enterAction" />
  </template>
  <template v-if="route === 'write'">
    <WriteEntry :enterAction="enterAction" />
  </template>
</template>
