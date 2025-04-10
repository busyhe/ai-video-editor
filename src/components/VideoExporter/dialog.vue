<template>
  <el-dialog
    v-model="dialogVisible"
    title="前端视频合成"
    width="90%"
    fullscreen
    :before-close="handleClose"
    :destroy-on-close="true"
  >
    <video-exporter />
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';
import VideoExporter from './index.vue';

const dialogVisible = ref(false);

function handleClose() {
  dialogVisible.value = false;
}

function open() {
  dialogVisible.value = true;
}

defineExpose({
  open
});
</script> 