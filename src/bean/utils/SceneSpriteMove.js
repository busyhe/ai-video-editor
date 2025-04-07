const {
	Graphics,
	Point
} = PIXI;

// 定义默认的判定范围，从容器边缘向内30像素为可拖拽区域
const decision_range = 30; // 从里到外判定范围 边距像素

/**
 * 为容器挂载移动功能
 * @param {PIXI.Application} app - PIXI应用实例
 * @param {PIXI.Container} container - 需要添加拖拽功能的容器
 * @param {Function} callback - 拖拽时的回调函数
 * @param {Number} decisionRange - 自定义判定范围，不传则使用默认值
 * 
 * 实现原理：
 * 1. 计算容器中心区域作为可拖拽区域
 * 2. 在容器中添加一个透明的图形作为拖拽判定区域
 * 3. 监听鼠标事件，实现拖拽功能
 */
export function mountMove(app, container, callback, decisionRange) {
	let dragging = false; // 标记是否处于拖拽状态
	let position = null; // 记录鼠标与容器的相对位置
	const range = getRange(container, decisionRange); // 获取容器的判定范围
	const graphics = mountMoveDecisionRange(app, range); // 创建判定区域图形
	container.addChild(graphics); // 将判定区域添加到容器中
	
	// 鼠标按下事件处理
	graphics.onmousedown = (event) => {
		const point = event.getLocalPosition(container); // 获取鼠标在容器中的本地坐标
		// 判断鼠标是否在判定范围内
		if (point.x > range.bounds.left && point.x < range.bounds.right &&
			point.y > range.bounds.top && point.y < range.bounds.bottom) {
			dragging = true; // 开始拖拽
			position = {
				x: event.data.global.x - container.x, // 计算鼠标与容器原点的相对x偏移
				y: event.data.global.y - container.y  // 计算鼠标与容器原点的相对y偏移
			};
		}
	}
	
	// 鼠标移动事件处理（绑定到舞台上，以便在鼠标移出容器后仍能响应）
	app.stage.on('mousemove', (event) => {
		if (dragging) {
			// 更新容器位置，保持鼠标与容器的相对位置不变
			container.position.set(
				event.data.global.x - position.x,
				event.data.global.y - position.y
			);
			callback(); // 执行回调函数
		}
	});
	
	// 鼠标释放事件处理（绑定到舞台上，确保在任何位置释放鼠标都能结束拖拽）
	app.stage.on('mouseup', (event) => {
		dragging = false; // 结束拖拽
		position = null; // 清除位置记录
	});
}

/**
 * 移除容器的移动功能
 * @param {PIXI.Container} container - 需要移除拖拽功能的容器
 * 
 * 实现原理：
 * 解绑所有与拖拽相关的事件监听器，移除判定区域
 */
export function unmountMove(container) {
	container.off('mousedown');
	container.off('mousemove');
	container.off('mouseup');
	container.off('mouseout');
	unmountMoveDecisionRange(container);
}

/**
 * 添加鼠标样式和拖拽判定区域
 * @param {PIXI.Application} app - PIXI应用实例
 * @param {Object} range - 判定范围对象
 * @returns {PIXI.Graphics} 创建的图形对象
 * 
 * 实现原理：
 * 1. 创建一个透明的矩形图形作为判定区域
 * 2. 为该区域添加鼠标样式变化的事件
 */
function mountMoveDecisionRange(app, range) {
	const graphics = new Graphics();
	graphics.zIndex = 1; // 设置图形的层级
	// 绘制一个矩形作为判定区域
	graphics.rect(range.bounds.left, range.bounds.top, range.width, range.height);
	graphics.fill('#0000'); // 填充透明颜色
	graphics.interactive = true; // 启用交互
	// 鼠标进入时将鼠标样式改为移动样式
	graphics.on('mouseenter', (event) => app.canvas.style.cursor = 'move');
	// 鼠标离开时恢复默认样式
	graphics.on('mouseleave', (event) => app.canvas.style.cursor = 'initial');
	return graphics;
}

/**
 * 移除拖拽判定区域
 * @param {PIXI.Container} container - 容器对象
 * 
 * 注：当前函数实现为空，实际应移除graphics子元素
 */
function unmountMoveDecisionRange(container) {
	// 移除所有子元素的实现被注释掉了
	// container.children.forEach(item => {
	// 	container.removeChild(item);
	// })
}

/**
 * 计算容器的判定范围
 * @param {PIXI.Container} container - 容器对象
 * @param {Number} decisionRange - 边缘距离，默认使用decision_range
 * @returns {Object} 包含判定范围信息的对象
 * 
 * 实现原理：
 * 1. 从容器边缘向内推进指定像素，形成一个内缩的矩形区域
 * 2. 返回该区域的尺寸和边界信息
 */
function getRange(container, decisionRange = decision_range) {
	return {
		width: container.width - decisionRange * 2, // 可拖拽区域宽度
		height: container.height - decisionRange * 2, // 可拖拽区域高度
		bounds: {
			left: decisionRange, // 左边界（距容器左边的距离）
			right: container.width - decisionRange, // 右边界
			top: decisionRange, // 上边界
			bottom: container.height - decisionRange, // 下边界
		}
	}
}