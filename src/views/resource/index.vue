<template>
	<div class="resource">
		<KeepAlive>
			<Transition name="fade" mode="out-in">
				<component :is="currenComponent"></component>
			</Transition>
		</KeepAlive>
	</div>
</template>

<script setup>
	import LoadingComponent from '../../components/loading-component.vue'
	import ErrorComponent from '../../components/error-component.vue'
	import {
		shallowRef,
		defineAsyncComponent
	} from 'vue'

	const currenComponent = shallowRef(null)

	const load = (data) => {
		currenComponent.value = defineAsyncComponent({
			loadingComponent: LoadingComponent,
			errorComponent: ErrorComponent,
			timeout: 5000,
			loader: () => {
				if (data.label == 'image') {
					return import(`./image.vue`);
				} else
				if (data.label == 'video') {
					return import(`./video.vue`);
				} else
				if (data.label == 'bgm') {
					return import(`./bgm.vue`);
				}else
				if (data.label == 'template') {
					return import(`./template.vue`);
				}else
				if (data.label == 'subtitle') {
					return import(`./subtitle/index.vue`);
				}
				return import(`./figure/index.vue`);
			}
		});
	}

	defineExpose({
		load
	})
</script>

<style scoped>
	.resource {
		padding: 20px;
		box-sizing: border-box;
		height: 100%;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.tabs {
		height: 100%;
	}

	.tabs .el-tabs__header {
		flex: 0 0 0%;
	}

	.tabs .el-tabs__content {
		flex: 1 1 0%
	}

	.tabs .el-tab-pane {
		height: 100%;
	}

	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.1s ease;
	}

	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}
</style>