/**
 * 引入依赖包
 */
import {
	v4 as uuidv4
} from 'uuid'
import LayerUnit from './LayerUnit.js'

/**
 * Layer 类：表示视频编辑中的一个图层
 * 包含多个图层单元(LayerUnit)，用于组织和管理相同类型的媒体元素
 */
export default class Layer {
	constructor() {
		// 生成唯一图层ID
		this.id = uuidv4();
		/* 元素集合：存储图层中的所有LayerUnit单元 */
		this.units = null
		/* 显示隐藏图层：控制图层是否可见 */
		this.display = true
		/* 静音图层：控制图层是否播放声音 */
		this.muted = false
		/* 实例元素：用于DOM操作的实例引用 */
		this.instance = null
	}

	/**
	 * 创建包含指定LayerUnit列表的Layer实例
	 * @param {...LayerUnit} list - 要添加到图层的LayerUnit实例列表
	 * @returns {Layer} - 新创建的Layer实例
	 */
	static list(...list) {
		const layer = new Layer()
		layer.units = list;
		return layer;
	}

	/**
	 * 克隆当前图层，包括其包含的所有单元
	 * @returns {Layer} - 克隆后的新Layer实例
	 */
	clone() {
		const newUnits = this.units.map(unit => unit.clone())
		return Layer.list(...newUnits)
	}

	/**
	 * 显示图层
	 */
	show() {
		this.display = true
	}

	/**
	 * 隐藏图层
	 */
	hide() {
		this.display = false
	}

	/**
	 * 销毁图层及其所有单元
	 * 释放资源并移除DOM元素
	 */
	destroy() {
		this.units.forEach(unit => unit.destroy())
		if (this.instance) this.instance.remove()
	}

	/**
	 * 从图层中移除指定ID的单元
	 * @param {string} id - 要移除的单元ID
	 */
	remove(id) {
		const index = this.units.findIndex(unit => unit.id == id)
		this.units[index].destroy()
		this.units.splice(index, 1)
	}

	/**
	 * 排序图层中的单元并处理重叠问题
	 * 按照时间轴位置(track.x)排序，并确保单元之间不会重叠
	 */
	sort() {
		this.units.sort((a, b) => a.track.x - b.track.x)
		for (let j = 0; j < this.units.length - 1; j++) {
			const current = this.units[j];
			const next = this.units[j + 1];
			if (current.track.x + current.track.w > next.track.x)
				next.track.x = current.track.x + current.track.w
		}
	}

	/**
	 * 获取指定索引位置的LayerUnit
	 * @param {number} index - 单元在图层中的索引
	 * @returns {LayerUnit} - 指定位置的LayerUnit实例
	 */
	get(index) {
		return this.units[index]
	}

	/**
	 * 获取图层元素类型
	 * 通过检查图层中的第一个单元来确定类型
	 * @returns {string|null} - 图层类型或null
	 */
	get type() {
		const unit = this.units.find(item => true)
		return unit ? unit.type : null;
	}

	/**
	 * 判断图层是否可见
	 * 通过检查图层中的第一个单元来确定可见性
	 * @returns {boolean|null} - 是否可见或null
	 */
	get visible() {
		const unit = this.units.find(item => true)
		return unit ? unit.visible : null;
	}

	/**
	 * 判断图层是否有声音
	 * 通过检查图层中的第一个单元来确定是否有声音
	 * @returns {boolean|null} - 是否有声音或null
	 */
	get audible() {
		const unit = this.units.find(item => true)
		return unit ? unit.audible : null;
	}

	/**
	 * 获取图层高度
	 * 通过检查图层中的第一个单元的高度
	 * @returns {number|null} - 图层高度或null
	 */
	get height() {
		const unit = this.units.find(item => true)
		return unit ? unit.track.h : null;
	}

	/**
	 * 获取图层中单元的数量
	 * @returns {number} - 图层中单元的数量
	 */
	get length() {
		return this.units.length
	}

	/**
	 * 将图层对象转换为JSON字符串
	 * 用于序列化和保存图层数据
	 * @returns {string} - 图层的JSON字符串表示
	 */
	get stringify() {
		return JSON.stringify({
			id: this.id,
			units: this.units.map(unit => unit.stringify),
			display: this.display,
			muted: this.muted
		})
	}

	/**
	 * 从JSON字符串解析创建Layer实例
	 * 用于反序列化和加载图层数据
	 * @param {string} str - 图层的JSON字符串表示
	 * @returns {Layer} - 从JSON创建的Layer实例
	 */
	static parse(str) {
		const data = JSON.parse(str);
		const layer = new Layer()
		layer.units = data.units.map(unit => LayerUnit.parse(unit))
		layer.display = data.display
		layer.muted = data.muted
		return layer;
	}

}