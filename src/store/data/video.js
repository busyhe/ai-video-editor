import {
	defineStore
} from 'pinia'
import {
	loadResource,
	save
} from '../../api/resource.js'
import {
	filePath
} from '../../api/file.js'
import VideoSource from '../../bean/source/VideoSource.js'
import {
	useLayersDataStore
} from '../layers.js'
import Layer from '../../bean/Layer.js'
import LayerUnit from '../../bean/LayerUnit.js'


export const useVideoDataStore = defineStore('video-data', {
	state: () => ({
		publicData: [],
		privateData: []
	}),
	actions: {
		async load(currentPage, pageSize) {
			const layersDataStore = useLayersDataStore()

			this.publicData.length = 0
			this.privateData.length = 0
			const res = await loadResource('video', currentPage, pageSize)
			res.forEach(item => {
				const video = new VideoSource({
					...item,
					url: filePath + item.url,
					cover: filePath + item.cover
				})
				if (item.creator == null) {
					this.publicData.push(video)

					const unit = new LayerUnit({
						resource: video.clone()
					})
					layersDataStore.addLayer(Layer.list(unit))
				} else {
					this.privateData.push(video)
				}

			})
		},
		async save({
			name,
			size,
			url,
			cover,
			duration,
			creator
		}) {
			await save(null, name, 'video', size, duration, url, cover, creator)
			await this.load()
		}
	},
})