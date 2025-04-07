import Source from "./Source";
import {
	v4 as uuidv4
} from 'uuid'

/**
 * VideoSource类 - 视频资源管理类
 * 继承自Source基类，专门用于处理视频类型的资源
 * 负责管理视频资源的元数据、初始化、截图等功能
 */
export default class VideoSource extends Source {
	/* 资源类型标识，用于资源分类和识别 */
	static TYPE = 'video'

	/**
	 * 构造函数
	 * @param {Object} options 视频资源的配置参数
	 * @param {string} options.id 资源唯一标识符，不传则自动生成uuid
	 * @param {string} options.name 资源名称，默认为'unnamed'
	 * @param {number} options.size 资源大小(字节)，默认为0
	 * @param {number} options.duration 视频时长(秒)
	 * @param {string} options.url 视频资源URL地址
	 * @param {string} options.cover 视频封面图URL地址
	 */
	constructor({
		id,
		name,
		size,
		duration,
		url,
		cover
	}) {
		super()
		this.id = id ? id : uuidv4();  // 不存在则创建新的uuid
		this.name = name ? name : 'unnamed';  // 默认名称为unnamed
		this.size = size ? size : 0;  // 默认大小为0
		this.duration = duration;  // 视频时长
		this.url = url;  // 视频地址
		this.cover = cover;  // 封面图
		/* 视频DOM实例，用于实际操作视频 */
		this.instance = null;
	}
 
	/**
	 * 克隆方法 - 创建当前视频资源的副本
	 * 注意：克隆会创建新的资源ID，避免ID冲突
	 * @returns {VideoSource} 返回新的VideoSource实例
	 */
	clone() {
		return new VideoSource({
			name: this.name,
			size: this.size,
			duration: this.duration,
			url: this.url,
			cover: this.cover
		})
	}

	/**
	 * 销毁方法 - 清理视频实例资源
	 * 从DOM中移除视频元素，释放内存
	 */
	destroy() {
		if (this.instance) this.instance.remove()
	}

	/**
	 * 初始化方法 - 加载视频资源
	 * 创建video元素并加载视频源，监听元数据加载完成事件
	 * @returns {Promise} 返回Promise，加载完成后resolved
	 */
	init() {
		return new Promise((resolve, reject) => {
			if (this._initialized == false) {
				// 创建video元素
				this.instance = document.createElement('video');
				this.instance.src = this.url;
				this.instance.load();
				// 监听元数据加载完成事件
				this.instance.addEventListener('loadedmetadata', () => {
					this._initialized = true
					resolve()
				});
			} else {
				resolve()
			}
		})
	}
	
	/**
	 * 截图方法 - 从视频当前帧生成截图
	 * 利用Canvas绘制视频当前帧并生成Blob对象
	 * @param {number} width 截图宽度，默认320px
	 * @param {number} height 截图高度，默认240px
	 * @returns {Promise<Blob>} 返回Promise，成功后resolved为图片Blob对象
	 */
	screenshot(width = 320, height = 240) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				// 创建canvas元素用于绘制
				let canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				// 计算适配的缩放比
				let scale = this._video.videoWidth / width;
				let frameWidth = width;
				let frameHeight = this._video.videoHeight / scale;
				// 计算居中位置
				let framePositionLeft = (width - frameWidth) / 2;
				let framePositionHeight = (height - frameHeight) / 2;
				// 在canvas上绘制视频帧
				canvas.getContext("2d").drawImage(this._video, framePositionLeft,
					framePositionHeight, frameWidth, frameHeight);
				// 转换为Blob对象并返回
				canvas.toBlob((blob) => resolve(blob))
			}, 500)  // 延时500ms确保视频已渲染
		})
	}

	/**
	 * 视图渲染方法 - 生成资源预览HTML
	 * 使用封面图和名称生成资源展示视图
	 * @returns {string} 返回包含封面和名称的HTML字符串
	 */
	get view() {
		return `<div class="source-view-image" style="background-image: url(${this.cover});">
			<span class="source-view-name">${this.name}</span>
		</div>`
	}

	/**
	 * 获取资源类型 - 返回资源类型标识
	 * @returns {string} 返回'video'类型标识
	 */
	get type() {
		return VideoSource.TYPE;
	}

	/**
	 * 序列化方法 - 将资源转换为JSON字符串
	 * 用于资源的存储和传输
	 * @returns {string} 返回包含资源所有属性的JSON字符串
	 */
	get stringify() {
		return JSON.stringify({
			type: this.type,
			id: this.id,
			name: this.name,
			size: this.size,
			duration: this.duration,
			url: this.url,
			cover: this.cover
		})
	}

	/**
	 * 静态解析方法 - 从JSON字符串创建实例
	 * 用于从存储中恢复资源对象
	 * @param {string} str JSON格式的资源数据字符串
	 * @returns {VideoSource} 返回新的VideoSource实例
	 */
	static parse(str) {
		return new VideoSource(JSON.parse(str))
	}
}