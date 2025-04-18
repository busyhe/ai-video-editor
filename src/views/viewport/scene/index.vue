<template>
	<!-- 场景容器，根据视口缩放比例进行缩放，并在加载时显示加载指示器 -->
	<div class="scene" :style="{ 'transform': `scale(${viewportStore.scale})` }" v-loading="loading"></div>
</template>

<script setup>
// 导入PIXI.js的核心组件用于图形渲染
const {
	Application, // PIXI应用实例
	Assets,      // 资源管理
	Container,   // 容器对象
	Sprite,      // 精灵对象
	Text,        // 文本对象
	TextStyle    // 文本样式
} = PIXI;
import {
	ref,
	reactive,
	onMounted,
	watch
} from 'vue'
import {
	reactifyObject,
	watchArray
} from '@vueuse/core'
import {
	useLayersDataStore
} from '../../../store/layers.js'
import {
	useViewportStore
} from '../../../store/viewport.js'
import {
	useTrackStore
} from '../../../store/track.js'
import {
	useGlobalStore
} from '../../../store/global.js'
import {
	useSubtitleDataStore
} from '../../../store/data/subtitle.js'
import {
	loadBackground,
	loadBackgroundText
} from '../../../bean/Scene.js'

// 获取各个状态管理仓库的实例
const subtitleDataStore = useSubtitleDataStore() // 字幕数据仓库
const viewportStore = useViewportStore()         // 视口状态仓库
const layersDataStore = useLayersDataStore()     // 图层数据仓库
const trackStore = useTrackStore()               // 轨道状态仓库
const globalStore = useGlobalStore()             // 全局设置仓库

const loading = ref(true)                        // 加载状态标志
const app = new Application();                   // 创建PIXI应用实例
const background = ref(null)                     // 背景引用
const backgroundText = ref(null)                 // 背景文字引用
viewportStore.app = app                          // 将PIXI应用实例存储到视口仓库中

/**
 * 加载场景中的所有图层单元
 * 遍历所有图层及其单元，初始化尚未初始化的单元场景
 */
const loadScene = async () => {
	for (let i = 0; i < layersDataStore.layers.length; i++) {
		const layer = layersDataStore.layers[i]
		for (let j = 0; j < layer.length; j++) {
			const unit = layer.get(j)
			// 如果单元场景未初始化，则进行初始化
			if (!unit.scene.initialized)
				await unit.scene.init(app, unit.resource)
		}
	}
}

/**
 * 加载所有字幕数据
 * 为每个字幕创建文本容器
 */
const loadSubtitle = async () => {
	for (const key in subtitleDataStore.data) {
		const one = subtitleDataStore.data[key]
		subtitleDataStore.loadTextContainers(app, one)
	}
}

/**
 * 渲染单个图层单元
 * 根据当前时间、单元可见性和播放状态控制单元的显示和播放
 * @param {Object} layer - 图层对象
 * @param {Number} layerIndex - 图层索引
 * @param {Object} unit - 图层单元对象
 */
const renderUnit = (layer, layerIndex, unit) => {
	// 处理文本、图像、视频和图形类型的图层
	if (['text', 'image', 'video', 'figure'].includes(layer.type)) {
		if (unit.scene.container) {
			if (unit.scene.initialized) {
				// 检查图层和单元是否应该显示
				if (layer.display && unit.display) {
					console.log( unit );
					const currentTime = trackStore.seekerTime - unit.duration.left
					// 检查当前时间是否在单元的时间范围内
					if (trackStore.seekerTime >= unit.duration.left &&
						trackStore.seekerTime <= unit.duration.right) {
						// 设置单元在场景中的z轴顺序和可见性
						unit.scene.container.zIndex = layersDataStore.layersTracks.length - layerIndex
						unit.scene.container.visible = true
						// 根据播放状态处理视频元素
						if (viewportStore.playing) {
							if (unit.resource.type == 'video') {
								unit.scene.play()
								unit.scene.muted(layer.muted || unit.muted)
							}
						} else {
							if (unit.resource.type == 'video') {
								unit.scene.pause()
								// 计算视频当前时间：起始时间(秒) + 当前位置时间(秒)
								unit.scene.currentTime((unit._durationStart / 1000) + (currentTime / 1000))
							}
						}
						// 更新单元的当前帧
						unit.scene.frame(unit.track.active)
					} else {
						// 如果当前时间不在单元的时间范围内，隐藏单元
						unit.scene.container.visible = false
						if (unit.resource.type == 'video') {
							unit.scene.pause()
							// 重置为视频起始位置
							unit.scene.currentTime(unit._durationStart / 1000)
						}
					}
				} else {
					// 如果图层或单元设置为不显示，隐藏单元
					unit.scene.container.visible = false
					if (unit.type == 'video') unit.scene.pause()
				}
			}
		}
	}
}

/**
 * 渲染字幕
 * 根据当前时间和字幕可见性控制字幕的显示
 */
const renderSubtitle = () => {
	subtitleDataStore.data.map(item => {
		if (item.textContainers) {
			// 检查当前时间是否在字幕的时间范围内且字幕设置为可见
			if (item.startTime <= trackStore.seekerTime && trackStore.seekerTime <= item.endTime && subtitleDataStore.visible) {
				item.textContainers.visible = true
			} else {
				item.textContainers.visible = false
			}
		}
	})
}

/**
 * 处理音频播放
 * 仅处理音频文件和图形中的音频，视频的音频在渲染时管理
 * @param {Object} layer - 图层对象
 * @param {Number} layerIndex - 图层索引
 * @param {Object} unit - 图层单元对象
 */
const listenUnit = (layer, layerIndex, unit) => {
	if (['audio', 'figure'].includes(layer.type)) {
		// 检查图层和单元是否静音
		if (!layer.muted && !unit.muted) {
			const currentTime = trackStore.seekerTime - unit.duration.left
			// 检查当前时间是否在单元的时间范围内
			if (trackStore.seekerTime >= unit.duration.left &&
				trackStore.seekerTime <= unit.duration.right) {
				// 根据播放状态控制音频播放
				if (viewportStore.playing) {
					if (unit.resource.play) unit.resource.play(currentTime)
				} else {
					if (unit.resource.pause) unit.resource.pause()
				}
			} else {
				// 如果当前时间不在单元的时间范围内，暂停音频
				if (unit.resource.pause) unit.resource.pause()
			}
		} else {
			// 如果图层或单元静音，暂停音频
			if (unit.resource.pause) unit.resource.pause()
		}
	}
}

/**
 * 渲染场景
 * 遍历所有图层和单元，根据可见性和可听性控制其渲染和播放
 */
const render = () => {
	layersDataStore.layers.forEach((layer, layerIndex) => {
		layer.units.forEach(unit => {
			// 根据图层可见性控制单元渲染
			if (layer.visible) renderUnit(layer, layerIndex, unit)
			if (layer.visible) renderSubtitle()
			// 根据图层可听性控制单元音频
			if (layer.audible) listenUnit(layer, layerIndex, unit)
		})
	})
}

/**
 * 设置PIXI应用的ticker用于处理时间和动画更新
 * 根据播放状态更新播放头位置
 */
const handleTicker = () => {
	let totalDeltaMS = 0                     // 累计时间差（毫秒）
	let seekerPlayingStartTime = 0           // 播放开始时的播放头位置
	app.ticker.add((ticker) => {
		if (viewportStore.playing) {
			// 如果正在播放，累加时间差并更新播放头位置
			totalDeltaMS += ticker.deltaMS
			trackStore.seekerTime = parseInt(seekerPlayingStartTime + totalDeltaMS)
		} else {
			// 如果暂停，重置累计时间差并记录当前播放头位置
			totalDeltaMS = 0;
			seekerPlayingStartTime = trackStore.seekerTime;
		}
	});
}

/**
 * 初始化PIXI应用和场景
 * 设置应用尺寸、背景和交互性，加载基础元素
 */
const init = async () => {
	const scene = document.querySelector('.scene')
	// 初始化PIXI应用，设置宽度、高度和背景色
	await app.init({
		width: globalStore.width,
		height: globalStore.height,
		background: viewportStore.background
	});
	app.stage.interactive = true             // 启用舞台交互
	scene.appendChild(app.canvas);           // 将PIXI画布添加到DOM
	background.value = await loadBackground(app)  // 加载背景
	// backgroundText.value = await loadBackgroundText(app)  // 加载背景文字（当前已注释）
	loading.value = false                    // 更新加载状态
	handleTicker()                           // 设置ticker
}

// 组件挂载后执行初始化和设置监听器
onMounted(async () => {
	// 初始化应用
	await init()

	// 监听图层场景变化，触发场景加载
	watch(() => layersDataStore.layersScenes, () => loadScene(), { immediate: true })

	// 监听字幕数据变化，触发字幕加载
	watch(() => subtitleDataStore.stringify, () => loadSubtitle(), { immediate: true })

	// 监听与渲染相关的状态变化，触发场景渲染
	watch(() => [
		layersDataStore.layersScenes,
		layersDataStore.layersTracks,
		trackStore.seekerTime,
		viewportStore.playing,
		subtitleDataStore.visible
	], () => render(), { immediate: true })
	
	// 监听全局尺寸变化，重设PIXI应用尺寸并重新加载背景
	watch(() => ({
		width: globalStore.width,
		height: globalStore.height
	}), async ({ width, height }) => {
		app.renderer.resize(width, height);
		if (background.value) background.value.destroy()
		background.value = await loadBackground(app)
		if (backgroundText.value) backgroundText.value.destroy()
		// backgroundText.value = await loadBackgroundText(app)
	}, { immediate: true })

})
</script>

<style></style>