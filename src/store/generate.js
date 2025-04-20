/**
 * @file generate.js
 * @description 视频生成相关的状态管理模块，负责视频合成和处理的核心逻辑
 */
import { defineStore } from "pinia";
import { ElNotification, ElMessage, ElMessageBox } from "element-plus";
import { h } from "vue";
import { useAccountStore } from "./account.js";
import { useLayersDataStore } from "./layers.js";
import { useMenuStore } from "./menu.js";
import { useGlobalStore } from "./global.js";
import { job } from "../api/batch.js";
import { useSubtitleDataStore } from "./data/subtitle.js";
import { createSrt } from "../utils/srt.js";
import { upload, filePath } from "../api/file.js";
import {
  Combinator,
  ImgClip,
  MP4Clip,
  EmbedSubtitlesClip,
  OffscreenSprite,
  AudioClip,
} from '@webav/av-cliper';

// 配置常量，集中管理全局配置参数
const CONFIG = {
  VIDEO: {
    WIDTH: 1920,
    HEIGHT: 1080,
    SAMPLE_RATE: 44100,
    CODE_RATE: "192k",
    CODEC: "libx264",
    FPS: 25,
    BG_COLOR: 'black',
  },
  DEFAULT_HOSTNAME: 'http://localhost:5173',
  MICROSECONDS_MULTIPLIER: 1e6,
};

/**
 * 创建文件写入器
 * @param {string} extName - 导出文件扩展名
 * @returns {Promise<FileSystemWritableFileStream>} 可写文件流
 */
async function createFileWriter(extName) {
  try {
    const fileHandle = await window.showSaveFilePicker({
      suggestedName: `WebAV-export-${Date.now()}.${extName}`,
    });
    return fileHandle.createWritable();
  } catch (error) {
    console.error('Failed to create file writer:', error);
    throw new Error('无法创建文件导出器，请检查浏览器权限');
  }
}

/**
 * 资源URL前缀处理
 * @param {string} url - 资源URL
 * @returns {string} 完整资源URL
 */
const getAssetUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${CONFIG.DEFAULT_HOSTNAME}${url}`;
};

/**
 * 创建进度消息框
 * @returns {Object} 消息框实例
 */
const createProgressMessageBox = () => {
  return ElMessageBox({
    title: '视频合成进度',
    message: h('div', {
      style: {
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '20px',
      }
    }, [
      h('div', { style: 'margin-bottom: 15px' }, '正在合成视频，请耐心等待...'),
      h('el-progress', {
        percentage: 0,
        striped: true,
        'striped-flow': true,
        duration: 100,
        strokeWidth: 20,
        textInside: true,
      }),
      h('div', {
        style: 'margin-top: 15px; font-size: 12px; color: #999'
      }, '合成过程中请勿关闭页面')
    ]),
    showCancelButton: false,
    showConfirmButton: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    closeOnHashChange: false,
  });
};

/**
 * 更新进度条UI
 * @param {number} progress - 进度百分比(0-100)
 */
const updateProgressUI = (progress) => {
  try {
    const progressComponent = document.querySelector('.el-message-box .el-progress .el-progress__text');
    if (progressComponent) {
      progressComponent.textContent = `${progress}%`;
    }

    const progressBarInner = document.querySelector('.el-message-box .el-progress .el-progress-bar__inner');
    if (progressBarInner) {
      progressBarInner.style.width = `${progress}%`;
    }
  } catch (err) {
    console.error('Failed to update progress UI', err);
  }
};

/**
 * 关闭消息框
 */
const closeMessageBox = () => {
  document.querySelector('.el-message-box__close')?.click();
};

/**
 * @description 视频生成功能的状态管理存储
 * @returns {Object} 提供视频生成功能的状态和操作方法
 */
export const useGenerateStore = defineStore("generate", {
  /**
   * @description 状态定义
   * @returns {Object} 状态对象
   */
  state: () => ({
    loading: false, // 加载状态标识，表示是否正在进行视频合成
    generating: false, // 视频生成中状态，用于禁用合成按钮
    progress: 0, // 当前视频生成进度，百分比，0-100
  }),
  /**
   * @description 操作方法集合
   */
  actions: {
    /**
     * 检查是否可以开始合成
     * @returns {boolean} 是否可以继续合成
     */
    checkBeforeCompound() {
      if (this.generating) {
        ElNotification({
          title: "操作提示",
          message: "视频正在合成中，请稍候...",
          type: "warning",
        });
        return false;
      }
      return true;
    },

    /**
     * 处理主音频层单元
     * @param {Object} layersDataStore - 图层数据存储
     * @returns {Array} 处理后的单元数组
     */
    processMainAudioLayer(layersDataStore) {
      const units = [];
      if (!layersDataStore.mainAudioLayer) return units;

      let time = 0;
      layersDataStore.mainAudioLayer.units.forEach((unit) => {
        if (time < unit.duration.left) {
          units.push({
            type: "main-audio-blank",
            duration: unit.duration.left - time,
          });
        }

        units.push({
          type: "main-audio",
          url: unit.resource.url,
          start: unit.duration.left,
          end: unit.duration.end,
          duration: unit.duration.duration,
          muted: unit.muted
        });

        time = unit.duration.right;
      });

      // 填充剩余时间
      if (time < layersDataStore.videoTotalDuration) {
        units.push({
          type: "main-audio-blank",
          duration: layersDataStore.videoTotalDuration - time,
        });
      }

      return units;
    },

    /**
     * 处理主视频层单元
     * @param {Object} layersDataStore - 图层数据存储
     * @returns {Array} 处理后的单元数组
     */
    processMainVideoLayer(layersDataStore) {
      const units = [];
      if (!layersDataStore.mainVideoLayer) return units;

      let time = 0;
      layersDataStore.mainVideoLayer.units.forEach((unit) => {
        if (time < unit.duration.left) {
          units.push({
            type: "main-video-blank",
            duration: unit.duration.left - time,
          });
        }

        units.push({
          type: "main-" + unit.type,
          url: unit.resource.url,
          _durationStart: unit._durationStart,
          _durationEnd: unit._durationEnd,
          originalDuration: unit.resource.duration,
          start: unit.duration.left,
          end: unit.duration.end,
          duration: unit.duration.duration,
          width: unit.scene.width,
          height: unit.scene.height,
          scale: {
            x: unit.scene.scale.x,
            y: unit.scene.scale.y,
          },
          overlay: {
            x: unit.scene.position.x,
            y: unit.scene.position.y,
          },
          muted: unit.muted
        });

        time = unit.duration.right;
      });

      // 填充剩余时间
      if (time < layersDataStore.videoTotalDuration) {
        units.push({
          type: "main-video-blank",
          duration: layersDataStore.videoTotalDuration - time,
        });
      }

      return units;
    },

    /**
     * 处理图层单元
     * @param {Object} layer - 图层对象
     * @param {boolean} check - 检查引用
     * @returns {Object} 处理结果 {units, isValid}
     */
    processLayerUnits(layer, check) {
      const units = [];
      let isValid = true;

      switch (layer.type) {
        case "audio":
          layer.units.forEach((unit) => {
            units.push({
              type: "audio",
              url: unit.resource.url,
              start: unit.duration.left,
              end: unit.duration.end,
              duration: unit.duration.duration,
              anchor: unit.duration.left,
            });
          });
          break;

        case "video":
          layer.units.forEach((unit) => {
            units.push({
              type: "video",
              url: unit.resource.url,
              _durationStart: unit._durationStart,
              _durationEnd: unit._durationEnd,
              originalDuration: unit.resource.duration,
              start: unit.duration.left,
              end: unit.duration.end,
              duration: unit.duration.duration,
              anchor: unit.duration.left,
              width: unit.scene.width,
              height: unit.scene.height,
              scale: {
                x: unit.scene.scale.x,
                y: unit.scene.scale.y,
              },
              overlay: {
                x: unit.scene.position.x,
                y: unit.scene.position.y,
              },
            });
          });
          break;

        case "image":
          layer.units.forEach((unit) => {
            units.push({
              type: "image",
              url: unit.resource.url,
              duration: unit.duration.duration,
              anchor: unit.duration.left,
              width: unit.scene.width,
              height: unit.scene.height,
              scale: {
                x: unit.scene.scale.x,
                y: unit.scene.scale.y,
              },
              overlay: {
                x: unit.scene.position.x,
                y: unit.scene.position.y,
              },
            });
          });
          break;

        case "figure":
          layer.units.forEach((unit) => {
            if (unit.resource.audio == null) {
              ElNotification({
                title: "请为数字人添加配音。",
                type: "warning",
              });
              isValid = false;
            } else {
              units.push({
                type: "figure-picture",
                avatar: unit.resource.url,
                audio: unit.resource.audio.url,
                anchor: unit.duration.left,
                scale: {
                  x: unit.scene.scale.x,
                  y: unit.scene.scale.y,
                },
                overlay: {
                  x: unit.scene.position.x,
                  y: unit.scene.position.y,
                },
              });
            }
          });
          break;
      }

      return { units, isValid };
    },

    /**
     * 处理所有其他图层
     * @param {Object} layersDataStore - 图层数据存储
     * @param {boolean} check - 检查引用
     * @returns {Object} 处理结果 {units, isValid}
     */
    processOtherLayers(layersDataStore, check) {
      let allUnits = [];
      let isValid = true;

      // 复制并反转图层数组（从上到下处理）
      const layers = [...layersDataStore.layers].reverse();

      // 处理非主图层
      layers.forEach((layer) => {
        if (
          layer.id !== layersDataStore.mainVideoLayerId &&
          layer.id !== layersDataStore.mainAudioLayerId
        ) {
          const { units, isValid: layerValid } = this.processLayerUnits(layer, check);
          allUnits = [...allUnits, ...units];
          if (!layerValid) isValid = false;
        }
      });

      return { units: allUnits, isValid };
    },

    /**
     * 处理字幕数据并上传
     * @param {Object} subtitleDataStore - 字幕数据存储
     * @returns {Promise<Object|null>} 字幕配置对象或null
     */
    async processSubtitles(subtitleDataStore) {
      if (!subtitleDataStore.visible || subtitleDataStore.data.length === 0) {
        return null;
      }

      try {
        // 创建SRT格式的字幕内容
        const srtContent = createSrt(subtitleDataStore.data);

        // 创建并上传SRT文件
        const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
        const file = new File([blob], "spacegt.srt", { type: blob.type });
        const res = await upload(file, "ai-video/source/srt");

        return {
          url: filePath + res.url,
        };
      } catch (error) {
        console.error("字幕处理失败:", error);
        ElNotification({
          title: "字幕处理失败",
          message: error.message || "上传字幕文件时发生错误",
          type: "error",
        });
        return null;
      }
    },

    /**
     * 创建媒体精灵
     * @param {Object} unit - 媒体单元对象
     * @returns {Promise<Object|null>} 精灵对象或null
     */
    async createSprite(unit) {
      try {
        const res = await fetch(getAssetUrl(unit.url));
        const body = res.body;
        if (!body) return null;

        const { MICROSECONDS_MULTIPLIER } = CONFIG;

        if (unit.type.includes('video')) {
          let mp4Clip = new MP4Clip(body, { audio: !unit.muted });

          // 优化视频分割处理：合并逻辑，增加错误处理，提高效率
          try {
            const msToMicroFactor = MICROSECONDS_MULTIPLIER / 1000; // 毫秒转微秒的转换因子
            
            // 检查并处理起始时间裁剪
            if (unit._durationStart > 0) {
              const splitTimeMs = unit._durationStart * msToMicroFactor;
              const [_, right] = await mp4Clip.split(splitTimeMs);
              mp4Clip = right;
            }
            
            // 检查并处理结束时间裁剪
            const originalDuration = unit.originalDuration || 0;
            if (unit._durationEnd < originalDuration && unit._durationEnd > 0) {
              // 计算从起始点到结束点的持续时间
              const durationMs = (unit._durationEnd - unit._durationStart) * msToMicroFactor;
              const [left, _] = await mp4Clip.split(durationMs);
              mp4Clip = left;
            }
          } catch (error) {
            console.warn('视频分割处理失败，将使用完整视频:', error);
            // 继续使用原始的mp4Clip
          }

          const videoSprite = new OffscreenSprite(mp4Clip);
          videoSprite.time.offset = (unit.anchor || unit.start || 0) / 1000 * MICROSECONDS_MULTIPLIER;
          videoSprite.time.duration = unit.duration / 1000 * MICROSECONDS_MULTIPLIER;
          videoSprite.rect.w = unit.width * unit.scale.x;
          videoSprite.rect.h = unit.height * unit.scale.y;
          videoSprite.rect.x = unit.overlay?.x || 0;
          videoSprite.rect.y = unit.overlay?.y || 0;
          console.debug('[DEBUG__store/generate.js-videoSprite]', videoSprite)
          return { sprite: videoSprite, isMain: unit.type.startsWith('main') };
        }

        if (unit.type.includes('image')) {
          const imgSprite = new OffscreenSprite(new ImgClip(body));
          imgSprite.time.offset = ((unit.anchor || 0) / 1000) * MICROSECONDS_MULTIPLIER;
          imgSprite.time.duration = unit.duration * MICROSECONDS_MULTIPLIER;
          imgSprite.rect.x = unit.overlay?.x || 0;
          imgSprite.rect.y = unit.overlay?.y || 0;
          return { sprite: imgSprite, isMain: unit.type.startsWith('main') };
        }

        if (unit.type.includes('audio')) {
          const audioSprite = new OffscreenSprite(new AudioClip(body, { volume: +!unit.muted }));
          audioSprite.time.offset = (unit.anchor || 0) * MICROSECONDS_MULTIPLIER;
          audioSprite.time.duration = unit.duration * MICROSECONDS_MULTIPLIER;
          return { sprite: audioSprite, isMain: unit.type.startsWith('main') };
        }

        return null;
      } catch (error) {
        console.error(`创建媒体精灵失败 (${unit.type}):`, error);
        return null;
      }
    },

    /**
     * 创建字幕精灵
     * @returns {Promise<Object|null>} 字幕精灵对象或null
     */
    async createSubtitleSprite() {
      try {
        const srtUrl = getAssetUrl('/assets/srt/1.srt');
        const text = await (await fetch(srtUrl)).text();
        const { WIDTH, HEIGHT } = CONFIG.VIDEO;

        const srtSprite = new OffscreenSprite(
          new EmbedSubtitlesClip(text, {
            videoWidth: WIDTH,
            videoHeight: HEIGHT
          })
        );

        return { sprite: srtSprite, isMain: false };
      } catch (error) {
        console.error('创建字幕精灵失败:', error);
        return null;
      }
    },

    /**
     * 合成视频并保存
     * @param {Object} com - 合成器实例
     * @returns {Promise<boolean>} 是否成功
     */
    async renderAndSaveVideo(com) {
      const timeStart = performance.now();
      let fileStream;

      try {
        fileStream = await createFileWriter('mp4');
        this.progress = 0;

        // 显示进度对话框
        const messageBoxInstance = createProgressMessageBox();

        // 注册进度事件处理器
        com.on('OutputProgress', (progress) => {
          this.progress = Math.round(progress * 100);
          console.debug('[DEBUG__store/generate.js-progress]', progress, this.progress)

          if (messageBoxInstance) {
            updateProgressUI(this.progress);
          }
        });

        // 处理输出
        await com.output().pipeTo(fileStream);

        // 关闭消息框
        closeMessageBox();

        // 显示完成通知
        ElNotification({
          title: '视频合成完成',
          message: `视频合成耗时: ${Math.round(performance.now() - timeStart)}ms`,
          type: 'success',
          duration: 5000,
        });

        return true;
      } catch (error) {
        console.error('Video generation error:', error);

        // 关闭消息框
        closeMessageBox();

        // 显示错误通知
        ElNotification({
          title: '视频合成失败',
          message: error.message || '发生未知错误，请重试',
          type: 'error',
          duration: 5000,
        });

        return false;
      } finally {
        console.debug('[DEBUG__render-time]', `合成耗时: ${Math.round(performance.now() - timeStart)}ms`);
      }
    },

    /**
     * @description 合成视频的主要方法，将各个图层、资源整合为最终视频
     * @returns {Promise<void>}
     */
    async compound() {
      // 初始检查，如果已经在生成中，阻止重复操作
      if (!this.checkBeforeCompound()) return;

      // 获取各个store实例
      const globalStore = useGlobalStore();
      const layersDataStore = useLayersDataStore();
      const menuStore = useMenuStore();
      const subtitleDataStore = useSubtitleDataStore();

      // 设置状态标识
      this.loading = true;
      this.generating = true;
      let check = true;

      try {
        // 定义视频合成选项
        const options = {
          samplingRate: CONFIG.VIDEO.SAMPLE_RATE,
          codeRate: CONFIG.VIDEO.CODE_RATE,
          width: CONFIG.VIDEO.WIDTH,
          height: CONFIG.VIDEO.HEIGHT,
          codec: CONFIG.VIDEO.CODEC,
          fps: CONFIG.VIDEO.FPS,
          units: []
        };

        // 处理主音频层
        const mainAudioUnits = this.processMainAudioLayer(layersDataStore);

        // 处理主视频层
        const mainVideoUnits = this.processMainVideoLayer(layersDataStore);

        // 处理其他图层
        const { units: otherUnits, isValid } = this.processOtherLayers(layersDataStore, check);
        if (!isValid) check = false;

        // 合并所有单元
        options.units = [...mainAudioUnits, ...mainVideoUnits, ...otherUnits];

        // 验证所需资源
        if (
          (layersDataStore.mainVideoLayer &&
            layersDataStore.mainVideoLayer.units.length === 0) ||
          options.units.length === 0
        ) {
          ElNotification({
            title: "请添加图片或视频背景素材。",
            type: "warning",
          });
          check = false;
        }

        // 处理字幕
        const subtitleConfig = await this.processSubtitles(subtitleDataStore);
        if (subtitleConfig) {
          options.subtitle = subtitleConfig;
        }

        // 如果所有条件满足，开始执行视频合成
        if (check) {
          console.debug('[DEBUG__options]', options);

          // 过滤出非空白单元
          const contentUnits = options.units.filter(unit => !unit.type.includes('blank'));

          // 创建合成器
          const combinator = new Combinator({
            width: CONFIG.VIDEO.WIDTH,
            height: CONFIG.VIDEO.HEIGHT,
            bgColor: CONFIG.VIDEO.BG_COLOR,
          });

          // 创建所有媒体精灵
          const spritePromises = contentUnits.map(unit => this.createSprite(unit));

          // 添加字幕精灵
          spritePromises.push(this.createSubtitleSprite());

          // 等待所有精灵创建完成
          const sprites = (await Promise.all(spritePromises)).filter(Boolean);

          // 将所有精灵添加到合成器
          for (const item of sprites) {
            if (item) {
              await combinator.addSprite(item.sprite);
            }
          }

          // 合成并保存视频
          await this.renderAndSaveVideo(combinator);
        }
      } catch (error) {
        console.error('Compound process error:', error);
        ElNotification({
          title: '视频合成过程中发生错误',
          message: error.message || '请检查资源是否正确',
          type: 'error',
        });
      } finally {
        // 无论成功与否，最后都将状态重置
        this.loading = false;
        this.generating = false;
      }
    },
  },
});
