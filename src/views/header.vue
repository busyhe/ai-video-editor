<template>
	<el-page-header icon="ArrowLeft" @back="onBack">
		<template #content>
			<span> AI 视频编辑器 </span>
			<slot></slot>
		</template>
	</el-page-header>
	<div class="project-name">
		<el-button v-if="editTitle == false" text @click="editTitle = true">
			{{ globalStore.title }}
			<el-icon>
				<Edit />
			</el-icon>
		</el-button>
		<el-input v-else v-model="globalStore.title" @change="onTitleChange">
			<template #suffix>
				<el-icon>
					<Edit />
				</el-icon>
			</template>
		</el-input>
	</div>
	<div class="button-group">
		<SwitchTheme></SwitchTheme>
		<el-button 
			type="primary" 
			icon="Monitor" 
			@click="generateStore.compound()"
			:loading="generateStore.generating"
			:disabled="generateStore.generating">
			{{ generateStore.generating ? '合成中 ' + generateStore.progress + '%' : '合成视频' }}
		</el-button>
		<el-button text type="primary" icon="Collection" @click="recordStore.saveProject()">保存项目</el-button>
	</div>
</template>

<script setup>
import SwitchTheme from '../components/switch-theme.vue'
import {
	ref,
} from 'vue'
import {
	useGlobalStore
} from '../store/global.js'
import {
	useRecordStore
} from '../store/record.js'
import {
	useGenerateStore
} from '../store/generate.js'

const recordStore = useRecordStore()
const generateStore = useGenerateStore()
const globalStore = useGlobalStore()
const editTitle = ref(false)

const onBack = () => {
	window.location.href = import.meta.env.VITE_APP_BACK_PATH;
}
const onTitleChange = () => {
	editTitle.value = false
}

</script>

<style scoped>
.el-page-header {
	color: var(--el-text-color-primary);
}


.project-name .el-button:hover .el-icon {
	opacity: 1;
}

.project-name .el-button .el-icon {
	opacity: 0;
	transition: opacity 0.2s;
}

.button-group {
	display: flex;
	gap: 10px;
	justify-content: end;
}

.button-group .switch-theme {
	margin-right: 20px;
}
</style>

<style scoped>
.profile-card {
	padding: 15px;
	display: flex;
	flex-direction: column;
}

.profile-card .name {
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	font-size: 16px;
	flex: 1 1 0%;
	overflow: hidden;
}

.profile-card .edit {
	flex: 0 0 32px;
}

.profile-card span {
	text-overflow: ellipsis;
	white-space: nowrap;
	overflow: hidden;
}

.profile-card .el-button {
	margin: 0;
}
</style>