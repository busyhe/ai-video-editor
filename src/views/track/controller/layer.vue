<template>
	<div class="controller layer" :style="{'height':data.height+'px'}">
		<el-button link size="small" disabled type="info">
			<el-tooltip v-if="data.type=='video'" effect="dark" content="视频" placement="top">
				<el-icon size="14px">
					<VideoCamera />
				</el-icon>
			</el-tooltip>
			<el-tooltip v-if="data.type=='image'" effect="dark" content="图片" placement="top">
				<el-icon size="14px">
					<Picture />
				</el-icon>
			</el-tooltip>
			<el-tooltip v-if="data.type=='text'" effect="dark" content="文本" placement="top">
				<el-icon size="14px">
					<font-awesome-icon icon="fa-solid fa-t" />
				</el-icon>
			</el-tooltip>
			<el-tooltip v-if="data.type=='figure'" effect="dark" content="数字人" placement="top">
				<el-icon size="14px">
					<font-awesome-icon icon="fa-solid fa-person" />
				</el-icon>
			</el-tooltip>
			<el-tooltip v-if="data.type=='audio'" effect="dark" content="音频" placement="top">
				<el-icon size="14px">
					<font-awesome-icon icon="fa-solid fa-headphones" />
				</el-icon>
			</el-tooltip>
		</el-button>
		<el-button link size="small" v-show="data.visible" @click="data.display=!data.display"
			@keydown.space.prevent="onSpace">
			<el-icon size="14px" v-if="data.display">
				<View />
			</el-icon>
			<el-icon size="14px" v-else>
				<Hide />
			</el-icon>
		</el-button>
		<el-button link size="small" v-show="data.audible" @click="onToggleMuted"
			@keydown.space.prevent="onSpace">
			<el-icon size="14px" v-if="data.muted">
				<font-awesome-icon icon="fa-solid fa-volume-xmark" />
			</el-icon>
			<el-icon size="14px" v-else>
				<font-awesome-icon icon="fa-solid fa-volume-low" />
			</el-icon>
		</el-button>
		<el-button link size="small" @click="onDel" @keydown.space.prevent="onSpace">
			<el-icon size="14px">
				<Delete />
			</el-icon>
		</el-button>
		<el-button v-if="data.id==layersDataStore.mainVideoLayerId" link size="small" disabled title="主视图">
			<el-icon size="14px">
				<Flag />
			</el-icon>
		</el-button>
		<el-button v-if="data.id==layersDataStore.mainAudioLayerId" link size="small" disabled title="主音轨">
			<el-icon size="14px">
				<Flag />
			</el-icon>
		</el-button>
		<div v-if="data.type=='figure'" class="top" >
			<el-tooltip effect="dark" content="数字人默认置顶" placement="top">
				<el-icon size="20">
					<svg aria-hidden="true">
						<use xlink:href="#top"></use>
					</svg>
				</el-icon>
			</el-tooltip>
		</div>
	</div>
</template>

<script setup>
	import {
		ref
	} from 'vue'
	import {
		useLayersDataStore
	} from '../../../store/layers.js'

	const props = defineProps({
		data: Object
	})
	const layersDataStore = useLayersDataStore()

	const onDel = () => {
		layersDataStore.delLayerById(props.data.id)
	}
	const onSpace = (event) => event.preventDefault();

	const onToggleMuted = () => {
		const muted = props.data.muted
		props.data.muted = !muted
		props.data.units.forEach(unit => {
			unit.muted = !muted
		})
	}
</script>

<style scoped>
	.controller.layer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
	}

	.controller.layer .el-button {
		margin-left: 0;
		height: min-content;
	}

	.top {
		position: absolute;
		top: -2px;
		right: 0;
	}
</style>