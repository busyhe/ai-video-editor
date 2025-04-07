/**
 * Scene.js - 场景对象管理类
 * 用于创建和管理视频编辑器中的各种媒体元素，如视频、图片、文本等
 * 基于PIXI.js实现的渲染系统
 */

import {
	v4 as uuidv4
} from 'uuid'
const {
	Assets,
	Container,
	Sprite,
	Text,
	TextStyle,
	Graphics
} = PIXI;
import {
	mountMove,
	unmountMove
} from './utils/SceneSpriteMove.js' // 导入元素移动控制相关方法
import {
	mountScale,
	unmountScale
} from './utils/SceneSpriteScale.js' // 导入元素缩放控制相关方法
import {
	wireframe,
	unWireframe
} from './utils/Wireframe.js' // 导入线框显示控制相关方法

/**
 * Scene类 - 场景对象核心类
 * 负责管理编辑器中的单个媒体元素(视频、图片、文本等)
 * 提供创建、播放、暂停、移动、缩放等功能
 */
export default class Scene {
	constructor() {
		this.id = uuidv4(); // 生成唯一标识符
		/* 最后更新时间，用于跟踪场景修改 */
		this.timestamp = 0;
		this.texture = null; // 存储加载的纹理资源
		this.sprite = null; // PIXI精灵对象，用于渲染图像/视频
		this.container = null; // PIXI容器，用于组织和管理场景内元素
		this.text = null; // 文本对象，用于渲染文本类型场景
		this._initialized = false; // 初始化标志
		this._old = null; //存储场景的历史状态数据
	}

	/**
	 * 克隆当前场景对象
	 * @returns {Scene} 新的场景实例
	 */
	clone() {
		return new Scene()
	}

	/**
	 * 销毁场景对象，释放资源
	 */
	destroy() {
		if (this.sprite) this.sprite.destroy()
		if (this.container) this.container.destroy()
	}

	/**
	 * 初始化场景对象
	 * @param {Object} app - PIXI应用实例
	 * @param {Object} resource - 资源配置对象，包含类型、URL等信息
	 */
	async init(app, resource) {
		if (['video', 'image', 'figure', 'text'].includes(resource.type)) {
			// 根据资源类型获取适当的加载器
			if (getLoadParserName(resource.type)) {
				// 加载资源并获取纹理
				this.texture = await loadAsset({
					alias: this.id,
					src: resource.url,
					loadParser: getLoadParserName(resource.type)
				})
			}
			// 根据资源类型选择合适的加载方法
			if (resource.type == 'video') {
				loadVideo(app, this, () => this.timestamp = new Date().getTime())
				this.pause() // 初始化时默认暂停视频
			} else
			if (resource.type == 'image' || resource.type == 'figure') {
				loadImage(app, this, () => this.timestamp = new Date().getTime())
			} else
			if (resource.type == 'text') {
				loadText(app, this, () => this.timestamp = new Date().getTime())
			}
			// 如果存在历史状态数据，则恢复位置和缩放
			if (this._old) {
				this.container.x = this._old.position.x
				this.container.y = this._old.position.y
				this.container.scale.x = this._old.scale.x
				this.container.scale.y = this._old.scale.y
			}
			this.container.visible = false // 初始化时默认隐藏
		}
		this._initialized = true
	}

	/**
	 * 播放视频资源
	 */
	play() {
		this.texture.source.resource.play()
	}

	/**
	 * 暂停视频资源
	 */
	pause() {
		this.texture.source.resource.pause()
	}

	/**
	 * 设置视频当前播放时间
	 * @param {Number} value - 时间值(秒)
	 */
	currentTime(value) {
		this.texture.source.resource.currentTime = value
	}

	/**
	 * 设置视频静音状态
	 * @param {Boolean} value - 是否静音
	 */
	muted(value) {
		this.texture.source.resource.muted = value
	}

	/**
	 * 控制场景线框显示
	 * @param {Boolean} value - 是否显示线框
	 */
	frame(value) {
		if (value) wireframe(this, () => this.timestamp = new Date().getTime())
		else unWireframe(this, () => this.timestamp = new Date().getTime())
	}

	/**
	 * 将场景对象序列化为JSON字符串
	 * @returns {String} 序列化后的字符串
	 */
	stringify() {
		return JSON.stringify({
			id: this.id
		})
	}

	/**
	 * 从字符串解析场景对象(实例方法版本)
	 * @param {String} str - JSON字符串
	 * @returns {Scene} 解析后的场景对象
	 */
	parse(str) {
		return new Scene()
	}

	/**
	 * 获取视频是否暂停状态
	 * @returns {Boolean} 是否暂停
	 */
	get paused() {
		return this.texture.source.resource.paused || false
	}

	/**
	 * 获取场景位置信息
	 * @returns {Object} 包含x、y坐标的对象
	 */
	get position() {
		if (this.container) {
			return {
				x: this.container.x,
				y: this.container.y
			}
		} else {
			return {
				x: 0,
				y: 0
			}
		}
	}

	/**
	 * 获取场景缩放信息
	 * @returns {Object} 包含x、y缩放比例的对象
	 */
	get scale() {
		if (this.container) {
			return {
				x: this.container.scale.x,
				y: this.container.scale.y
			}
		} else {
			return {
				x: 0,
				y: 0
			}
		}
	}

	/**
	 * 获取场景初始化状态
	 * @returns {Boolean} 是否已初始化
	 */
	get initialized() {
		return this._initialized;
	}

	/**
	 * 获取完整场景信息的JSON字符串(getter方法)
	 * @returns {String} 序列化后的完整场景信息
	 */
	get stringify() {
		return JSON.stringify({
			id: this.id,
			timestamp: this.timestamp,
			position: this.position,
			scale: this.scale
		})
	}

	/**
	 * 从JSON字符串解析场景对象(静态方法)
	 * @param {String} str - JSON字符串
	 * @returns {Scene|null} 解析后的场景对象，解析失败则返回null
	 */
	static parse(str) {
		try {
			const data = JSON.parse(str)
			const scene = new Scene()
			scene.id = data.id;
			scene.timestamp = data.timestamp;
			scene._old = {
				position: data.position,
				scale: data.scale
			}
			return scene;
		} catch (e) {
			return null;
		}
	}
}

/**
 * 根据资源类型获取对应的PIXI加载器名称
 * @param {String} type - 资源类型
 * @returns {String|null} 加载器名称或null
 */
const getLoadParserName = (type) => {
	switch (type) {
		case 'video':
			return 'loadVideo';
		case 'image':
			return 'loadTextures';
		case 'figure':
			return 'loadTextures';
	}
	return null;
}

/**
 * 加载单个资产资源
 * @param {Object} asset - 资产配置对象
 * @param {String} asset.alias - 资产别名
 * @param {String} asset.src - 资产URL或相对路径
 * @param {String} asset.loadParser - 加载器名称
 * @returns {Promise<Object>} 加载完成的资源对象
 * 
 * LoadParserName - PIXI.js内置的解析器名称列表:
 * loadJson - 加载JSON文件
 * loadSVG - 加载SVG文件
 * loadTextures - 加载纹理/图像
 * loadTxt - 加载文本文件
 * loadVideo - 加载视频文件
 * loadWebFont - 加载网页字体
 * 也可使用自定义解析器
 */
const loadAsset = async (asset) => {
	return await Assets.load({
		alias: asset.alias,
		src: {
			src: asset.src,
			loadParser: asset.loadParser
		}
	});
}

/**
 * 批量加载多个资源
 * @param {...Object} assets - 多个资产配置对象
 * @returns {Promise<Array>} 加载完成的资源对象数组
 */
const loadAssets = async (...assets) => {
	const result = []
	for (let i = 0; i < assets.length; i++) {
		result.push(await loadAsset(assets[i]))
	}
	return result;
}

/**
 * 加载图像资源并创建场景
 * @param {Object} app - PIXI应用实例
 * @param {Scene} scene - 场景对象
 * @param {Function} callback - 加载完成回调函数
 */
const loadImage = (app, scene, callback) => {
	const container = new Container() // 创建PIXI容器
	container.interactive = true // 启用交互
	const sprite = Sprite.from(scene.texture); // 从纹理创建精灵
	container.addChild(sprite) // 将精灵添加到容器
	mountMove(app, container, callback) // 挂载移动控制
	mountScale(app, container, callback) // 挂载缩放控制
	center(app, container) // 居中显示
	app.stage.addChild(container); // 将容器添加到舞台
	scene.container = container // 保存容器引用
	scene.sprite = sprite // 保存精灵引用
}

/**
 * 加载视频资源并创建场景
 * @param {Object} app - PIXI应用实例
 * @param {Scene} scene - 场景对象
 * @param {Function} callback - 加载完成回调函数
 */
const loadVideo = (app, scene, callback) => {
	const container = new Container()
	container.interactive = true
	const sprite = Sprite.from(scene.texture);
	container.addChild(sprite)
	mountMove(app, container, callback)
	mountScale(app, container, callback)
	center(app, container)
	app.stage.addChild(container);
	scene.container = container
	scene.sprite = sprite
}

/**
 * 创建文本场景
 * @param {Object} app - PIXI应用实例
 * @param {Scene} scene - 场景对象
 * @param {Function} callback - 加载完成回调函数
 */
const loadText = (app, scene, callback) => {
	const container = new Container()
	container.interactive = true
	// 创建文本对象，设置默认样式
	const basicText = new Text({
		text: '默认文本',
		style: {
			fontFamily: 'Arial',
			fontSize: 50,
			fill: '#FFFFFF',
			align: 'center',
		}
	});
	container.addChild(basicText);
	mountMove(app, container, callback, 0) // 只允许移动，最后参数0表示不添加缩放控制
	center(app, container)
	app.stage.addChild(container);
	scene.container = container
	scene.text = basicText
}

/**
 * 加载背景图像
 * @param {Object} app - PIXI应用实例
 * @returns {Promise<Sprite>} 背景精灵对象
 */
const loadBackground = async (app) => {
	const background = await Assets.load('/assets/image/background.jpg');
	const backgroundSprite = new Sprite(background);
	backgroundSprite.width = app.screen.width // 设置背景宽度为屏幕宽度
	backgroundSprite.height = app.screen.height // 设置背景高度为屏幕高度
	backgroundSprite.alpha = 0 // 设置透明度为0（完全透明）
	app.stage.addChild(backgroundSprite); // 添加到舞台
	return backgroundSprite;
}

/**
 * 创建背景文本
 * @param {Object} app - PIXI应用实例
 * @returns {Text} 文本对象
 */
const loadBackgroundText = (app) => {
	// 创建文本样式
	const style = new TextStyle({
		fontFamily: 'Arial',
		fontSize: app.screen.width / 20, // 字体大小根据屏幕宽度动态调整
		fontWeight: 'bold',
		fill: '#999999'
	});
	// 创建文本对象
	const basicText = new Text({
		text: 'Editor Background',
		style
	});
	basicText.x = app.screen.width / 2; // 水平居中
	basicText.y = app.screen.height / 2; // 垂直居中
	basicText.anchor.set(0.5); // 设置锚点为中心点
	app.stage.addChild(basicText); // 添加到舞台
	return basicText;
}

/**
 * 将容器居中显示在屏幕上
 * @param {Object} app - PIXI应用实例
 * @param {Container} container - PIXI容器
 */
const center = (app, container) => {
	container.x = app.screen.width / 2 - (container.width / 2); // 水平居中
	container.y = app.screen.height / 2 - (container.height / 2); // 垂直居中
}

// 导出背景相关函数供外部使用
export {
	loadBackground,
	loadBackgroundText
}