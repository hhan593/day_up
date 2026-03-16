<!--
 * @Author: hh
 * @Date: 2025-06-27 10:13:02
 * @LastEditors: hh
 * @LastEditTime: 2025-06-27 10:30:10
 * @Description: 
-->
<script setup>
import { ref } from "vue";

const msg = ref("Hello World!");
</script>

<template>
  <h1 v-once>{{ msg }}</h1>
  <input v-model="msg" />
</template>
<style scoped></style>
