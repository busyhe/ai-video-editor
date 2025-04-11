import {
	v4 as uuidv4
} from 'uuid'
import {
	useTrackStore
} from '../store/track.js'
import Scene from './Scene.js'
import Track from './Track.js'
import * as SourceUtils from './utils/SourceUtils.js'

/**
 * LayerUnit 类
 * 
 * 这是视频编辑器中的图层单元基础类，代表时间轴上的一个媒体元素
 * 负责管理媒体资源与其在轨道上的表现形式之间的关系
 * 包含资源信息、场景属性、轨道位置等核心数据
 */
export default class LayerUnit {
	/**
	 * 构造函数 - 创建一个新的图层单元
	 * 
	 * @param {Object} options - 配置参数
	 * @param {string} [options.id] - 图层ID，若不提供则自动生成UUID
	 * @param {Object} [options.resource] - 媒体资源对象（视频、音频、图片等）
	 * @param {Scene} [options.scene] - 场景配置，包含变换、滤镜等视觉效果
	 * @param {Track} [options.track] - 轨道信息，包含位置和尺寸
	 */
	constructor({
		id,
		resource,
		scene,
		track
	}) {
		// 唯一标识符，用于区分不同图层
		this.id = id ? id : uuidv4();
		
		/* 轨道配置 - 获取全局轨道状态管理器 */
		this.trackStore = useTrackStore()
		
		/* 资源信息 - 存储媒体资源的引用 */
		this.resource = resource;
		
		/**
		 * 资源时间相关属性
		 * _durationStart: 资源的开始时间点（毫秒）
		 * _durationEnd: 资源的结束时间点（毫秒）
		 * 这两个属性用于控制资源实际使用的时间段
		 */
		this._durationStart = 0
		this._durationEnd = resource ? resource.duration : 0
		
		/* 场景信息 - 包含变换、效果等视觉属性 */
		this.scene = scene || new Scene()
		
		/* 轨道信息 - 控制在时间轴上的位置和长度 */
		this.track = track || new Track({
			x: 0, // 轨道起始位置（像素）
			// 根据资源时长计算轨道宽度，应用缩放系数转换时间到像素单位
			w: (resource ? resource.duration : 0) / this.trackStore.rulerScaleTime * this.trackStore.rulerScaleWidth,
		})
		
		/* 显示属性 - 控制图层是否可见 */
		this.display = true
		
		/* 静音属性 - 控制音频是否播放 */
		this.muted = false

		// 注释掉的代码，可能是早期版本设计
		// /* 开始时间,并不是真实时间,仅为显示的开始时间(ms) */
		// _durationStart = 0
		// /* 结束时间,并不是真实时间,仅为显示的结束时间(ms) */
		// _durationEnd = 0
	}

	/**
	 * 销毁方法
	 * 
	 * 清理资源，释放内存
	 * 级联销毁关联的资源、轨道和场景对象
	 */
	destroy() {
		this.resource.destroy()
		this.track.destroy()
		this.scene.destroy()
	}

	/**
	 * 克隆方法
	 * 
	 * 创建当前图层单元的副本
	 * 注意：目前只克隆资源，不克隆场景属性
	 * 
	 * @returns {LayerUnit} 新的图层单元实例
	 */
	clone() {
		const unit = new LayerUnit({
			resource: this.resource.clone(),
			scene: this.scene.clone() // 当前未实现场景克隆
		})
		return unit;
	}

	/**
	 * 分割方法
	 * 
	 * 将当前图层按指定比例分成两部分
	 * 修改当前图层为前半部分，并返回新创建的后半部分
	 * 
	 * @param {number} ratio - 分割比例，0-1之间的小数
	 * @returns {LayerUnit} 分割后的新图层单元（后半部分）
	 */
	split(ratio) {
		const start = this._durationStart
		const end = this._durationEnd
		// 计算分割点时间
		const splitLine = parseInt((end - start) * ratio);
		
		// 修改当前对象的结束时间为分割点
		this._durationEnd = start + splitLine;
		// 更新轨道宽度，根据新的时长重新计算
		this.track.w = (this._durationEnd - this._durationStart) * this.trackStore.milliscondWidth;
		
		// 克隆生成新的图层单元对象
		const unit = this.clone();
		// 设置新对象的时间范围为原对象分割点到原结束点
		unit._durationStart = start + splitLine;
		unit._durationEnd = end;
		// 设置新对象的轨道位置紧接在当前对象之后
		unit.track.x = this.track.x + this.track.w
		// 更新新对象的轨道宽度
		unit.track.w = (unit._durationEnd - unit._durationStart) * this.trackStore.milliscondWidth;
		
		return unit;
	}

	/**
	 * 视图属性
	 * 
	 * 获取资源的视图表示
	 * 
	 * @returns {string} 资源视图或默认文本
	 */
	get view() {
		if (this.resource) {
			return this.resource.view
		} else
			return '<没有绑定资源>'
	}

	/**
	 * 时长相关属性
	 * 
	 * 计算并返回图层在时间轴上的各种时间属性
	 * 包括开始、结束、总时长以及左右边界位置
	 * 
	 * @returns {Object} 包含各种时间信息的对象
	 */
	get duration() {
		return {
			start: 0,
			end: parseInt(this.track.w / this.trackStore.milliscondWidth),
			duration: parseInt(this.track.w / this.trackStore.milliscondWidth),
			left: parseInt(this.track.x / this.trackStore.milliscondWidth),
			right: parseInt((this.track.x + this.track.w) / this.trackStore.milliscondWidth)
		}
	}

	/**
	 * 轨道最大宽度
	 * 
	 * 计算视频资源可能的最大轨道宽度
	 * 非视频资源返回0
	 * 
	 * @returns {number} 最大宽度（像素）
	 */
	get trackMaxWidth() {
		if (this.resource.type == 'video')
			return parseInt((this._durationEnd - this._durationStart) * this.trackStore.milliscondWidth)
		else
			return 0
	}

	/**
	 * 资源类型
	 * 
	 * 返回媒体资源的类型（视频、音频、图片等）
	 * 
	 * @returns {string} 资源类型
	 */
	get type() {
		return this.resource.type
	}

	/**
	 * 可调整大小属性
	 * 
	 * 判断该图层是否可以调整大小（拉伸、缩放）
	 * 目前只有图片、视频和文本支持调整
	 * 
	 * @returns {boolean} 是否可调整大小
	 */
	get resizable() {
		return ['image', 'video', 'text'].includes(this.resource.type);
	}

	/**
	 * 可见性属性
	 * 
	 * 判断该图层是否有可视内容
	 * 只有图片、视频、图形和文本类型是可见的
	 * 
	 * @returns {boolean} 是否可见
	 */
	get visible() {
		return ['image', 'video', 'figure', 'text'].includes(this.type)
	}

	/**
	 * 可听性属性
	 * 
	 * 判断该图层是否有音频内容
	 * 只有图形、音频和视频类型是可听的
	 * 
	 * @returns {boolean} 是否可听
	 */
	get audible() {
		return ['figure', 'audio', 'video'].includes(this.type)
	}

	/**
	 * 序列化属性
	 * 
	 * 将图层单元转换为JSON字符串
	 * 用于保存和传输
	 * 
	 * @returns {string} JSON字符串表示
	 */
	get stringify() {
		return JSON.stringify({
			id: this.id,
			resource: this.resource.stringify,
			scene: this.scene.stringify,
			track: this.track.stringify,
			display: this.display,
			muted: this.muted
		})
	}

	/**
	 * 解析方法
	 * 
	 * 从JSON字符串创建图层单元实例
	 * 用于加载保存的项目
	 * 
	 * @param {string} str - JSON字符串
	 * @returns {LayerUnit} 新的图层单元实例
	 */
	static parse(str) {
		const data = JSON.parse(str);
		const unit = new LayerUnit({
			id: data.id,
			resource: SourceUtils.autoParse(data.resource),
			scene: Scene.parse(data.scene),
			track: Track.parse(data.track)
		})
		unit.display = data.display
		unit.muted = data.muted
		return unit;
	}
}