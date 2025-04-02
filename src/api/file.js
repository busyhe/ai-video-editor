/**
 * 文件服务API模块
 * 用于处理文件上传、下载以及PPT转图片等相关操作
 */
import axios from '../axios/index.js'
import {
	useStateStore
} from '../store/global.js'
import {
	v4 as uuidv4
} from 'uuid'

/**
 * 文件服务器资源路径前缀
 * 从环境变量中获取，用于拼接完整的文件访问URL
 */
export const filePath = import.meta.env.VITE_APP_FILE_RESOURCE + ''

/**
 * 文件上传函数
 * 
 * @param {File} file - 要上传的文件对象
 * @param {string} path - 文件在服务器上的存储路径
 * @returns {Promise<Object>} - 返回包含上传文件URL的Promise对象
 * @example
 * // 上传图片文件到指定路径
 * const result = await upload(imageFile, 'ai-video-editor/source/image');
 * console.log(result.url); // 获取上传后的文件URL
 */
export function upload(file, path) {
	// 获取全局状态管理器，用于显示上传进度
	const stateStore = useStateStore()
	// 生成唯一的上传任务ID
	const id = uuidv4()
	// 发起上传请求
	return axios({
		method: 'post',
		url: import.meta.env.VITE_APP_FILE_SERVER + '/upload',
		headers: {
			'Content-Type': 'multipart/form-data'
		},
		withCredentials: false,
		data: {
			file,
			path
		},
		// 上传进度回调函数
		onUploadProgress(progressEvent) {
			// 向用户展示当前上传进度
			stateStore.push(id, `正在上传文件请勿关闭页面,当前进度${parseInt(progressEvent.progress*100)}%.`)
			// 当上传完成时，移除进度提示
			if (progressEvent.progress == 1)
				stateStore.destroy(id)
		}
	})
}

/**
 * 文件下载函数
 * 
 * @param {string} url - 要下载的文件URL
 * @returns {Promise<Blob>} - 返回包含文件Blob数据的Promise对象
 * @example
 * // 下载指定URL的文件
 * const blob = await download('path/to/file.mp4');
 * // 创建下载链接
 * const link = document.createElement('a');
 * link.href = URL.createObjectURL(blob);
 * link.download = 'filename.mp4';
 * link.click();
 */
export function download(url) {
	return axios({
		method: 'get',
		url: import.meta.env.VITE_APP_FILE_SERVER + '/download/' + url,
		responseType: 'blob',
		withCredentials: false,
	})
}

/**
 * PPT转图片函数
 * 将PowerPoint文件转换为图片集合
 * 
 * @param {File} file - 要转换的PPT文件对象
 * @returns {Promise<Object>} - 返回包含转换后图片信息的Promise对象
 * @example
 * // 将PPT文件转换为图片集合
 * const images = await ppt2image(pptFile);
 */
export function ppt2image(file) {
	return axios({
		method: 'post',
		url: import.meta.env.VITE_APP_FILE_SERVER + '/ppt/ppt2image',
		headers: {
			'Content-Type': 'multipart/form-data'
		},
		withCredentials: false,
		data: {
			file
		}
	})
}