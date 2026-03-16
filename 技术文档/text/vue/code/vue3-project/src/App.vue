<!--
 * @Author: hh
 * @Date: 2025-06-27 10:03:57
 * @LastEditors: hh
 * @LastEditTime: 2025-06-27 10:30:16
 * @Description: 
-->

<script setup lang="ts">
import Compa from "./components/A.vue";
import { ref } from "vue";
const name: string = "tom";
const msg = ref("111111");
</script>

<template>
  <!-- <div>vue-project</div> -->
  <Compa id="compa" class="comp-class" name="name" msg="msg"></Compa>
</template>
