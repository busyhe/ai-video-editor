/**
 * @file generate.js
 * @description 视频生成相关的状态管理模块，负责视频合成和处理的核心逻辑
 */
import { defineStore } from "pinia";
import { ElNotification } from "element-plus";
import { useAccountStore } from "./account.js";
import { useLayersDataStore } from "./layers.js";
import { useMenuStore } from "./menu.js";
import { useGlobalStore } from "./global.js";
import { job } from "../api/batch.js";
import { useSubtitleDataStore } from "./data/subtitle.js";
import { createSrt } from "../utils/srt.js";
import { upload, filePath } from "../api/file.js";

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
  }),
  /**
   * @description 操作方法集合
   */
  actions: {
    /**
     * @description 合成视频的主要方法，将各个图层、资源整合为最终视频
     * @returns {Promise<void>}
     */
    async compound() {
      // 获取各个store实例，用于状态管理和数据获取
      const globalStore = useGlobalStore();
      const layersDataStore = useLayersDataStore();
      const menuStore = useMenuStore();
      const subtitleDataStore = useSubtitleDataStore();
      
      // 设置加载状态为true，表示开始处理
      this.loading = true;
      let check = true; // 合成前的检查标志，用于确认是否满足所有合成条件
      
      /**
       * 定义视频合成的基本参数配置
       * @property {number} samplingRate - 音频采样率，单位Hz
       * @property {string} codeRate - 视频码率
       * @property {number} width - 视频宽度，单位像素
       * @property {number} height - 视频高度，单位像素
       * @property {string} codec - 视频编码器
       * @property {number} fps - 帧率，每秒帧数
       */
      const options = {
        samplingRate: 44100,
        codeRate: "192k",
        width: 1920,
        height: 1080,
        codec: "libx264",
        fps: 25,
      };
      
      // 定义合成单元数组，用于存储所有要合成的媒体片段
      const units = [];
      
      /**
       * 处理主音频层
       * 将主音频层的所有单元添加到合成单元数组中，并在相应位置添加空白音频
       */
      if (layersDataStore.mainAudioLayer) {
        let time = 0; // 当前处理到的时间点
        layersDataStore.mainAudioLayer.units.forEach((unit) => {
          // 如果当前时间点与下一个单元的起始时间有间隔，添加空白音频
          if (time < unit.duration.left) {
            units.push({
              type: "main-audio-blank", // 空白音频类型
              duration: unit.duration.left - time, // 空白时长
            });
          }
          // 添加主音频单元
          units.push({
            type: "main-audio",
            url: unit.resource.url, // 音频资源URL
            start: unit.duration.start, // 音频起始时间
            end: unit.duration.end, // 音频结束时间
            duration: unit.duration.duration, // 音频持续时间
          });
          time = unit.duration.right; // 更新当前时间点
        });
        // 如果主音频结束后视频总时长还有剩余，添加最后的空白音频
        if (time < layersDataStore.videoTotalDuration) {
          units.push({
            type: "main-audio-blank",
            duration: layersDataStore.videoTotalDuration - time,
          });
        }
      }
      
      /**
       * 处理主视频层
       * 将主视频层的所有单元添加到合成单元数组中，并在相应位置添加空白视频
       */
      if (layersDataStore.mainVideoLayer) {
        let time = 0; // 当前处理到的时间点
        layersDataStore.mainVideoLayer.units.forEach((unit) => {
          // 如果当前时间点与下一个单元的起始时间有间隔，添加空白视频
          if (time < unit.duration.left) {
            units.push({
              type: "main-video-blank", // 空白视频类型
              duration: unit.duration.left - time, // 空白时长
            });
          }
          // 添加主视频单元
          units.push({
            type: "main-" + unit.type, // 主视频类型标识
            url: unit.resource.url, // 视频资源URL
            start: unit.duration.start, // 视频起始时间
            end: unit.duration.end, // 视频结束时间
            duration: unit.duration.duration, // 视频持续时间
            scale: { // 视频缩放比例
              x: unit.scene.scale.x,
              y: unit.scene.scale.y,
            },
            overlay: { // 视频在画面中的位置
              x: unit.scene.position.x,
              y: unit.scene.position.y,
            },
          });
          time = unit.duration.right; // 更新当前时间点
        });
        // 如果主视频结束后视频总时长还有剩余，添加最后的空白视频
        if (time < layersDataStore.videoTotalDuration) {
          units.push({
            type: "main-video-blank",
            duration: layersDataStore.videoTotalDuration - time,
          });
        }
      }
      
      /**
       * 处理其他图层
       * 复制图层数组并反转顺序（从上到下处理）
       */
      let layers = [...layersDataStore.layers];
      layers.reverse();
      
      // 遍历所有图层，处理非主视频和主音频的图层
      layers.forEach((layer) => {
        if (
          layer.id != layersDataStore.mainVideoLayerId &&
          layer.id != layersDataStore.mainAudioLayerId
        ) {
          /**
           * 处理音频图层
           */
          if (layer.type == "audio") {
            layer.units.forEach((unit) => {
              units.push({
                type: "audio",
                url: unit.resource.url, // 音频资源URL
                start: unit.duration.start, // 音频起始时间
                end: unit.duration.end, // 音频结束时间
                duration: unit.duration.duration, // 音频持续时间
                anchor: unit.duration.left, // 音频锚点（在时间轴上的位置）
              });
            });
          }
          
          /**
           * 处理视频图层
           */
          if (layer.type == "video") {
            layer.units.forEach((unit) => {
              units.push({
                type: "video",
                url: unit.resource.url, // 视频资源URL
                start: unit.duration.start, // 视频起始时间
                end: unit.duration.end, // 视频结束时间
                duration: unit.duration.duration, // 视频持续时间
                anchor: unit.duration.left, // 视频锚点（在时间轴上的位置）
                scale: { // 视频缩放比例
                  x: unit.scene.scale.x,
                  y: unit.scene.scale.y,
                },
                overlay: { // 视频在画面中的位置
                  x: unit.scene.position.x,
                  y: unit.scene.position.y,
                },
              });
            });
          }
          
          /**
           * 处理图片图层
           */
          if (layer.type == "image") {
            layer.units.forEach((unit) => {
              units.push({
                type: "image",
                url: unit.resource.url, // 图片资源URL
                duration: unit.duration.duration, // 图片显示持续时间
                anchor: unit.duration.left, // 图片锚点（在时间轴上的位置）
                scale: { // 图片缩放比例
                  x: unit.scene.scale.x,
                  y: unit.scene.scale.y,
                },
                overlay: { // 图片在画面中的位置
                  x: unit.scene.position.x,
                  y: unit.scene.position.y,
                },
              });
            });
          }
          
          /**
           * 处理数字人图层
           */
          if (layer.type == "figure") {
            layer.units.forEach((unit) => {
              // 检查数字人是否有配音，如果没有则提示错误
              if (unit.resource.audio == null) {
                ElNotification({
                  title: "请为数字人添加配音。",
                  type: "warning",
                });
                check = false; // 不满足合成条件
              } else {
                units.push({
                  type: "figure-picture",
                  avatar: unit.resource.url, // 数字人头像URL
                  audio: unit.resource.audio.url, // 数字人配音URL
                  anchor: unit.duration.left, // 数字人锚点（在时间轴上的位置）
                  scale: { // 数字人缩放比例
                    x: unit.scene.scale.x,
                    y: unit.scene.scale.y,
                  },
                  overlay: { // 数字人在画面中的位置
                    x: unit.scene.position.x,
                    y: unit.scene.position.y,
                  },
                });
              }
            });
          }
        }
      });
      
      // 将所有合成单元添加到选项中
      options.units = units;
      
      /**
       * 检查合成条件：
       * 1. 主视频层必须有单元
       * 2. 合成单元数组不能为空
       */
      if (
        (layersDataStore.mainVideoLayer &&
          layersDataStore.mainVideoLayer.units.length == 0) ||
        options.units.length == 0
      ) {
        ElNotification({
          title: "请添加图片或视频背景素材。",
          type: "warning",
        });
        check = false; // 不满足合成条件
      }
      
      /**
       * 处理字幕
       * 如果字幕可见且有字幕数据，将字幕转换为SRT文件并上传
       */
      if (subtitleDataStore.visible && subtitleDataStore.data.length > 0) {
        // 创建SRT格式的字幕内容
        const srtContent = createSrt(subtitleDataStore.data);
        // 创建Blob对象
        const blob = new Blob([srtContent], {
          type: "text/plain;charset=utf-8",
        });
        // 创建File对象
        const file = new File([blob], "spacegt.srt", { type: blob.type });
        // 上传SRT文件
        const res = await upload(file, "ai-video/source/srt");
        // 添加字幕配置到选项中
        options.subtitle = {
          url: filePath + res.url,
        };
      }
      
      /**
       * 如果所有条件满足，开始执行视频合成
       */
      if (check) {
        // 提交合成作业到服务器
        const result = await job(
          "channel-synthesis-job", // 作业类型
          globalStore.title, // 视频标题
          options // 合成选项
        );
        
        // 处理作业提交结果
        if (result) {
          // 显示成功通知
          ElNotification({
            title: "视频合成作业已提交",
            type: "success",
          });
          // 显示作业进度对话框
          menuStore.jobProgressDialogVisible = true;
        }
      }
      
      // 无论成功与否，最后都将加载状态设置为false
      this.loading = false;
    },
  },
});
