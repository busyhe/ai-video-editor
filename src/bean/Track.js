import {
	v4 as uuidv4
} from 'uuid'
import {
	useTrackStore
} from '../store/track.js'

/**
 * Track 类
 * 表示时间轴上的一个轨道元素
 * 负责管理轨道的位置、尺寸、状态及交互行为
 */
export default class Track {
	/**
	 * 构造函数
	 * @param {Object} params - 轨道初始化参数
	 * @param {string} params.id - 轨道唯一标识符（可选，若不提供则自动生成）
	 * @param {number} params.x - 轨道初始 x 坐标
	 * @param {number} params.w - 轨道初始宽度
	 * @param {number} params.h - 轨道高度
	 */
	constructor({
		id,
		x,
		w,
		h
	}) {
		// 唯一标识符，如果没有提供则使用 uuid 生成
		this.id = id ? id : uuidv4()
		/* 轨道配置 */
		this.trackStore = useTrackStore()
		/* 原始坐标 - 存储未缩放的实际坐标值 */
		this._x = x
		/* 原始宽度 - 存储未缩放的实际宽度值 */
		this._w = w
		/* 高度,可调整 - 如果未提供默认为50 */
		this.h = h ? h : 50;
		/* 拖拽中状态 - 标记轨道是否正在被拖拽 */
		this.dragging = false;
		/* 组件实例 - 关联的 DOM 元素引用 */
		this.instance = null;
		/* 组件激活状态 - 标记轨道是否被选中/激活 */
		this.active = false;
	}

	/**
	 * 销毁方法
	 * 清理轨道相关资源，移除 DOM 元素
	 */
	destroy() {
		if (this.instance) this.instance.remove()
	}

	/**
	 * 主动触发鼠标事件
	 * 模拟在轨道中心点的鼠标按下事件
	 * 通常用于以编程方式激活轨道
	 * @param {Event} event - 原始事件对象
	 */
	onMousedown(event) {
		const rect = this.instance.getBoundingClientRect()
		var mouseEvent = new MouseEvent('mousedown', {
			'view': window,
			'bubbles': true,
			'cancelable': false,
			'clientX': rect.x + (rect.width / 2),
			'clientY': rect.y + (rect.height / 2)
		});
		this.instance.dispatchEvent(mouseEvent)
	}

	/**
	 * x 坐标 getter
	 * 返回考虑缩放因子后的实际屏幕坐标
	 * @returns {number} 缩放后的 x 坐标
	 */
	get x() {
		return parseInt(this._x * this.trackStore.controllerScale);
	}

	/**
	 * x 坐标 setter
	 * 设置坐标时自动处理边界条件并转换为原始未缩放值
	 * @param {number} value - 要设置的 x 坐标值
	 */
	set x(value) {
		if (value < 0) this._x = 0
		else this._x = parseInt(value / this.trackStore.controllerScale)
	}

	/**
	 * w 宽度 getter
	 * 返回考虑缩放因子后的实际屏幕宽度
	 * @returns {number} 缩放后的宽度
	 */
	get w() {
		return parseInt(this._w * this.trackStore.controllerScale);
	}

	/**
	 * w 宽度 setter
	 * 设置宽度时自动处理边界条件并转换为原始未缩放值
	 * @param {number} value - 要设置的宽度值
	 */
	set w(value) {
		if (value < 0) this._w = 0
		else this._w = parseInt(value / this.trackStore.controllerScale)
	}

	/**
	 * 获取轨道在时间轴上的位置范围
	 * @returns {Object} 包含左右边界的位置对象
	 */
	get location() {
		return {
			left: this.x,
			right: this.x + this.w
		}
	}

	/**
	 * 获取轨道的序列化字符串表示
	 * 用于保存轨道状态或传输
	 * @returns {string} 轨道数据的 JSON 字符串
	 */
	get stringify() {
		return JSON.stringify({
			id: this.id,
			x: this._x,
			w: this._w,
			h: this.h
		})
	}

	/**
	 * 从字符串解析创建轨道实例
	 * 静态工厂方法，用于反序列化轨道数据
	 * @param {string} str - 包含轨道数据的 JSON 字符串
	 * @returns {Track|null} 解析成功返回新的轨道实例，失败返回 null
	 */
	static parse(str) {
		try {
			return new Track(JSON.parse(str))
		} catch (e) {
			return null;
		}
	}

}