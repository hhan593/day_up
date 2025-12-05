<!--
 * @Author: hh
 * @Date: 2025-06-27 10:10:33
 * @LastEditors: hh
 * @LastEditTime: 2025-06-30 14:25:52
 * @Description: 
-->
<template>
  <div v-bind="$attrs"></div>
  <Compb></Compb>

  <div>123</div>
</template>

<script setup lang="ts">
import Compb from "./B.vue";
import { useAttrs } from "vue";
//props默认为响应式
const props = defineProps({
  msg: {
    type: String,
    default: "11111",
  },
  name: {
    type: String,
  },
});
const attrs = useAttrs();
console.log(attrs);
console.log(props);
</script>
<style scoped></style>
