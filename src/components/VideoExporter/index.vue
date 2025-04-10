<template>
  <div class="video-exporter">
    <div class="header">
      <h3>前端视频合成</h3>
      <div class="controls">
        <el-button :disabled="loading" @click="togglePlayPause">{{ playing ? '暂停' : '播放' }}</el-button>
        <el-button :disabled="loading" @click="exportVideo" type="primary">导出视频</el-button>
      </div>
    </div>
    <div class="preview-container">
      <div ref="canvasWrapperRef" class="canvas-wrapper"></div>
    </div>
    <div class="timeline-editor-container">
      <div class="timeline-controls">
        <span class="scale-label">缩放：</span>
        <el-button circle size="small" @click="setScale(scale + 1)">-</el-button>
        <el-button circle size="small" @click="setScale(scale - 1 > 1 ? scale - 1 : 1)">+</el-button>
        <el-divider direction="vertical" />
        <el-button size="small" :disabled="!activeAction" @click="deleteAction">删除</el-button>
        <el-button size="small" :disabled="!activeAction" @click="splitAction">分割</el-button>
      </div>
      <div class="timeline-wrapper" ref="timelineWrapperRef"></div>
    </div>
    <div class="media-controls">
      <el-button size="small" @click="addMedia('video')">
        <el-icon><VideoCamera /></el-icon> 添加视频
      </el-button>
      <el-button size="small" @click="addMedia('audio')">
        <el-icon><Microphone /></el-icon> 添加音频
      </el-button>
      <el-button size="small" @click="addMedia('image')">
        <el-icon><Picture /></el-icon> 添加图片
      </el-button>
      <el-button size="small" @click="addMedia('text')">
        <el-icon><Edit /></el-icon> 添加文字
      </el-button>
    </div>
    <el-dialog v-model="textDialogVisible" title="添加文字" width="500px">
      <el-form>
        <el-form-item label="文字内容">
          <el-input v-model="textContent" type="text" placeholder="请输入文字内容"></el-input>
        </el-form-item>
        <el-form-item label="文字样式">
          <el-input v-model="textStyle" type="text" placeholder="CSS 样式，例如: font-size: 40px; color: white;"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="textDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddText">确定</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="loading" title="处理中" width="300px" :close-on-click-modal="false" :show-close="false">
      <div class="loading-content">
        <el-progress :percentage="exportProgress" :stroke-width="20"></el-progress>
        <p>{{ loadingText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { AVCanvas } from '@webav/av-canvas';
import { AudioClip, ImgClip, MP4Clip, VisibleSprite, renderTxt2ImgBitmap } from '@webav/av-cliper';
import { Timeline, TimelineState } from '@xzdarcy/react-timeline-editor';
import { Picture, VideoCamera, Microphone, Edit } from '@element-plus/icons-vue';
import { saveAs } from 'file-saver';
import { useLayersDataStore } from '../../store/layers.js';

// 可视区域和时间轴相关引用
const canvasWrapperRef = ref(null);
const timelineWrapperRef = ref(null);
const layersDataStore = useLayersDataStore();

// AVCanvas实例和相关状态
const avCanvas = ref(null);
const timelineState = ref(null);
const playing = ref(false);
const scale = ref(10);

// 时间轴数据状态
const timelineData = ref([
  { id: '1-video', name: '视频轨道', actions: [] },
  { id: '2-audio', name: '音频轨道', actions: [] },
  { id: '3-image', name: '图片轨道', actions: [] },
  { id: '4-text', name: '文字轨道', actions: [] }
]);
const activeAction = ref(null);

// 文字添加对话框
const textDialogVisible = ref(false);
const textContent = ref('示例文字');
const textStyle = ref('font-size: 40px; color: white;');

// 导出相关状态
const loading = ref(false);
const loadingText = ref('准备中...');
const exportProgress = ref(0);

// 精灵与动作之间的映射关系
const actionSpriteMap = new WeakMap();

// 用于硬件加速设置
const hardwareAcceleration = 'prefer-hardware';

// 初始化AVCanvas
onMounted(async () => {
  if (canvasWrapperRef.value) {
    const cvs = new AVCanvas(canvasWrapperRef.value, {
      bgColor: '#000',
      width: 1280,
      height: 720
    });
    
    avCanvas.value = cvs;
    
    cvs.on('timeupdate', (time) => {
      if (timelineState.value) {
        timelineState.value.setTime(time / 1e6);
      }
    });
    
    cvs.on('playing', () => {
      playing.value = true;
    });
    
    cvs.on('paused', () => {
      playing.value = false;
    });
    
    // 初始化时间轴编辑器
    initTimelineEditor();
  }
});

// 清理资源
onBeforeUnmount(() => {
  if (avCanvas.value) {
    avCanvas.value.destroy();
  }
});

// 初始化时间轴编辑器
function initTimelineEditor() {
  if (!timelineWrapperRef.value) return;
  
  const timeline = new Timeline({
    container: timelineWrapperRef.value,
    onChange: () => {},
    style: { width: '100%', height: '200px' },
    scale: scale.value,
    editorData: timelineData.value,
    effects: {},
    scaleSplitCount: 5,
    onClickTimeArea: (time) => {
      previewTime(time);
      return true;
    },
    onCursorDragEnd: (time) => {
      previewTime(time);
    },
    onActionResizing: ({ dir, action, start, end }) => {
      if (dir === 'left') return false;
      return changeDuration({ action, start, end });
    },
    onActionMoveEnd: ({ action }) => {
      changeOffset(action);
    },
    onClickAction: (_, { action }) => {
      activeAction.value = action;
    },
    getActionRender: (action) => {
      const el = document.createElement('div');
      el.style.height = '100%';
      el.style.display = 'flex';
      el.style.justifyContent = 'center';
      el.style.alignItems = 'center';
      el.style.color = 'white';
      el.textContent = action.name;
      
      if (action.id === activeAction.value?.id) {
        el.style.border = '1px solid #f56c6c';
        el.style.boxSizing = 'border-box';
      }
      
      return el;
    },
    autoScroll: true
  });
  
  timelineState.value = timeline;
}

// 设置时间轴缩放比例
function setScale(newScale) {
  scale.value = newScale;
  if (timelineState.value) {
    timelineState.value.setScale(newScale);
  }
}

// 在特定时间点预览帧
function previewTime(time) {
  if (avCanvas.value) {
    avCanvas.value.previewFrame(time * 1e6);
  }
}

// 更改媒体片段的位置
function changeOffset(action) {
  const spr = actionSpriteMap.get(action);
  if (!spr) return;
  spr.time.offset = action.start * 1e6;
}

// 更改媒体片段的持续时间
function changeDuration({ action, start, end }) {
  const spr = actionSpriteMap.get(action);
  if (!spr) return false;
  const duration = (end - start) * 1e6;
  if (duration > spr.getClip().meta.duration) return false;
  spr.time.duration = duration;
  return true;
}

// 切换播放/暂停状态
function togglePlayPause() {
  if (!avCanvas.value || !timelineState.value) return;
  
  if (playing.value) {
    avCanvas.value.pause();
  } else {
    avCanvas.value.play({ start: timelineState.value.getTime() * 1e6 });
  }
}

// 添加媒体(视频、音频、图片、文字)
async function addMedia(type) {
  if (!avCanvas.value) return;
  
  try {
    switch (type) {
      case 'video':
        await addVideoMedia();
        break;
      case 'audio':
        await addAudioMedia();
        break;
      case 'image':
        await addImageMedia();
        break;
      case 'text':
        textDialogVisible.value = true;
        break;
    }
  } catch (error) {
    console.error('添加媒体失败:', error);
    ElMessage.error('添加媒体失败');
  }
}

// 添加视频
async function addVideoMedia() {
  try {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'video/mp4,video/quicktime';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      loading.value = true;
      loadingText.value = '处理视频中...';
      
      try {
        const stream = file.stream();
        const spr = new VisibleSprite(
          new MP4Clip(stream, {
            __unsafe_hardwareAcceleration__: hardwareAcceleration
          })
        );
        
        await avCanvas.value.addSprite(spr);
        addSprite2Track('1-video', spr, '视频');
        
        loading.value = false;
      } catch (error) {
        console.error('处理视频失败:', error);
        ElMessage.error('处理视频失败');
        loading.value = false;
      }
    };
    
    fileInput.click();
  } catch (error) {
    console.error('添加视频失败:', error);
    ElMessage.error('添加视频失败');
  }
}

// 添加音频
async function addAudioMedia() {
  try {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mpeg,audio/wav,audio/mp4';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      loading.value = true;
      loadingText.value = '处理音频中...';
      
      try {
        const stream = file.stream();
        const spr = new VisibleSprite(new AudioClip(stream));
        
        await avCanvas.value.addSprite(spr);
        addSprite2Track('2-audio', spr, '音频');
        
        loading.value = false;
      } catch (error) {
        console.error('处理音频失败:', error);
        ElMessage.error('处理音频失败');
        loading.value = false;
      }
    };
    
    fileInput.click();
  } catch (error) {
    console.error('添加音频失败:', error);
    ElMessage.error('添加音频失败');
  }
}

// 添加图片
async function addImageMedia() {
  try {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/gif';
    
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      loading.value = true;
      loadingText.value = '处理图片中...';
      
      try {
        const stream = file.stream();
        let args;
        
        if (/\.gif$/i.test(file.name)) {
          args = { type: 'image/gif', stream };
        } else {
          args = stream;
        }
        
        const spr = new VisibleSprite(new ImgClip(args));
        spr.time.duration = 10e6; // 默认图片显示10秒
        
        await avCanvas.value.addSprite(spr);
        addSprite2Track('3-image', spr, '图片');
        
        loading.value = false;
      } catch (error) {
        console.error('处理图片失败:', error);
        ElMessage.error('处理图片失败');
        loading.value = false;
      }
    };
    
    fileInput.click();
  } catch (error) {
    console.error('添加图片失败:', error);
    ElMessage.error('添加图片失败');
  }
}

// 确认添加文本
async function confirmAddText() {
  if (!textContent.value) {
    ElMessage.warning('请输入文字内容');
    return;
  }
  
  textDialogVisible.value = false;
  loading.value = true;
  loadingText.value = '处理文字中...';
  
  try {
    const spr = new VisibleSprite(
      new ImgClip(
        await renderTxt2ImgBitmap(
          textContent.value,
          textStyle.value
        )
      )
    );
    
    spr.time.duration = 10e6; // 默认文字显示10秒
    
    await avCanvas.value.addSprite(spr);
    addSprite2Track('4-text', spr, '文字');
    
    // 重置文字对话框
    textContent.value = '示例文字';
    textStyle.value = 'font-size: 40px; color: white;';
    
    loading.value = false;
  } catch (error) {
    console.error('处理文字失败:', error);
    ElMessage.error('处理文字失败');
    loading.value = false;
  }
}

// 添加精灵到轨道
function addSprite2Track(trackId, spr, name = '') {
  const track = timelineData.value.find(({ id }) => id === trackId);
  if (!track) return null;

  const start = spr.time.offset === 0
    ? Math.max(...track.actions.map((a) => a.end), 0) * 1e6
    : spr.time.offset;

  spr.time.offset = start;
  
  // 如果是图片并且持续时间是无限的，设置为10秒
  if (spr.time.duration === Infinity) {
    spr.time.duration = 10e6;
  }

  const action = {
    id: Math.random().toString(),
    start: start / 1e6,
    end: (spr.time.offset + spr.time.duration) / 1e6,
    effectId: '',
    name,
  };

  actionSpriteMap.set(action, spr);

  track.actions.push(action);
  
  // 更新时间轴数据
  timelineData.value = [...timelineData.value];
  
  // 更新时间轴UI
  if (timelineState.value) {
    timelineState.value.setEditorData(timelineData.value);
  }
  
  return action;
}

// 删除选中的动作
function deleteAction() {
  if (!activeAction.value || !avCanvas.value) return;
  
  const spr = actionSpriteMap.get(activeAction.value);
  if (!spr) return;
  
  avCanvas.value.removeSprite(spr);
  actionSpriteMap.delete(activeAction.value);
  
  const track = timelineData.value.find(t => t.actions.includes(activeAction.value));
  if (!track) return;
  
  track.actions.splice(track.actions.indexOf(activeAction.value), 1);
  timelineData.value = [...timelineData.value];
  
  // 更新时间轴UI
  if (timelineState.value) {
    timelineState.value.setEditorData(timelineData.value);
  }
  
  activeAction.value = null;
}

// 分割媒体片段
async function splitAction() {
  if (!activeAction.value || !avCanvas.value || !timelineState.value) return;
  
  const spr = actionSpriteMap.get(activeAction.value);
  if (!spr) return;
  
  const currentTime = timelineState.value.getTime() * 1e6;
  const splitPosition = currentTime - spr.time.offset;
  
  if (splitPosition <= 0 || splitPosition >= spr.time.duration) {
    ElMessage.warning('无法在当前位置分割媒体');
    return;
  }
  
  loading.value = true;
  loadingText.value = '分割媒体中...';
  
  try {
    // 分割媒体片段
    const newClips = await spr.getClip().split(splitPosition);
    
    // 移除原有对象
    avCanvas.value.removeSprite(spr);
    actionSpriteMap.delete(activeAction.value);
    
    const track = timelineData.value.find(t => t.actions.includes(activeAction.value));
    if (!track) {
      loading.value = false;
      return;
    }
    
    track.actions.splice(track.actions.indexOf(activeAction.value), 1);
    
    // 添加分割后生成的两个新对象
    const sprsDuration = [
      splitPosition,
      spr.time.duration - splitPosition
    ];
    
    const sprsOffset = [
      spr.time.offset,
      spr.time.offset + sprsDuration[0]
    ];
    
    for (let i = 0; i < newClips.length; i++) {
      const clip = newClips[i];
      const newSpr = new VisibleSprite(clip);
      
      if (clip instanceof ImgClip) {
        newSpr.time.duration = sprsDuration[i];
      }
      
      newSpr.time.offset = sprsOffset[i];
      await avCanvas.value.addSprite(newSpr);
      addSprite2Track(track.id, newSpr, activeAction.value.name);
    }
    
    // 更新时间轴UI
    if (timelineState.value) {
      timelineState.value.setEditorData(timelineData.value);
    }
    
    activeAction.value = null;
    loading.value = false;
  } catch (error) {
    console.error('分割媒体失败:', error);
    ElMessage.error('分割媒体失败');
    loading.value = false;
  }
}

// 导出视频
async function exportVideo() {
  if (!avCanvas.value) return;
  
  try {
    const hasActions = timelineData.value.some(track => track.actions.length > 0);
    if (!hasActions) {
      ElMessage.warning('请先添加媒体内容');
      return;
    }
    
    loading.value = true;
    loadingText.value = '准备导出视频...';
    exportProgress.value = 0;
    
    // 创建组合器
    const combinator = await avCanvas.value.createCombinator({ 
      __unsafe_hardwareAcceleration__: hardwareAcceleration 
    });
    
    // 设置进度回调
    combinator.onProgress((progress) => {
      exportProgress.value = Math.round(progress * 100);
      loadingText.value = `导出中...${exportProgress.value}%`;
    });
    
    // 创建文件写入流
    const fileStream = await createFileWriter();
    
    // 导出并保存
    await combinator.output().pipeTo(fileStream);
    
    loading.value = false;
    ElMessage.success('视频导出成功');
  } catch (error) {
    console.error('导出视频失败:', error);
    ElMessage.error('导出视频失败');
    loading.value = false;
  }
}

// 创建文件写入流
async function createFileWriter() {
  const suggestedName = `视频_${new Date().toISOString().replace(/[:.]/g, '_')}.mp4`;
  
  try {
    // 尝试使用File System Access API (现代浏览器)
    const fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [{
        description: 'MP4 视频',
        accept: { 'video/mp4': ['.mp4'] }
      }]
    });
    return await fileHandle.createWritable();
  } catch (e) {
    // 回退到在内存中构建并使用FileSaver提供下载
    return new WritableStream({
      _chunks: [],
      write(chunk) {
        this._chunks.push(chunk);
      },
      close() {
        const blob = new Blob(this._chunks, { type: 'video/mp4' });
        saveAs(blob, suggestedName);
      }
    });
  }
}
</script>

<style scoped>
.video-exporter {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-container {
  width: 100%;
  aspect-ratio: 16/9;
  background-color: #000;
  margin-bottom: 16px;
  border-radius: 4px;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

.timeline-editor-container {
  width: 100%;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scale-label {
  margin-right: 8px;
}

.timeline-wrapper {
  width: 100%;
  height: 200px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.media-controls {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.loading-content {
  padding: 20px;
  text-align: center;
}
</style> 