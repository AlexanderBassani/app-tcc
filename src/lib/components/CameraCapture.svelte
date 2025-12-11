<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let { onCapture = () => {}, label = 'Tirar Foto' } = $props<{
		onCapture?: (imageData: string) => void;
		label?: string;
	}>();

	const dispatch = createEventDispatcher();

	let videoElement: HTMLVideoElement;
	let canvasElement: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let capturedImage = $state<string | null>(null);
	let isCameraActive = $state(false);
	let error = $state<string | null>(null);

	async function startCamera() {
		try {
			error = null;
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment', // Câmera traseira
					width: { ideal: 1920 },
					height: { ideal: 1080 }
				}
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				isCameraActive = true;
			}
		} catch (err) {
			console.error('Erro ao acessar câmera:', err);
			error = 'Não foi possível acessar a câmera. Verifique as permissões.';
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		isCameraActive = false;
	}

	function capturePhoto() {
		if (!videoElement || !canvasElement) return;

		const context = canvasElement.getContext('2d');
		if (!context) return;

		// Configurar canvas com as dimensões do vídeo
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;

		// Desenhar frame atual do vídeo no canvas
		context.drawImage(videoElement, 0, 0);

		// Converter para base64
		const imageData = canvasElement.toDataURL('image/jpeg', 0.8);
		capturedImage = imageData;

		// Parar câmera
		stopCamera();

		// Emitir evento
		onCapture(imageData);
		dispatch('capture', { imageData });
	}

	function retake() {
		capturedImage = null;
		startCamera();
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				const imageData = event.target?.result as string;
				capturedImage = imageData;
				onCapture(imageData);
				dispatch('capture', { imageData });
			};
			reader.readAsDataURL(file);
		}
	}

	// Cleanup ao desmontar
	$effect(() => {
		return () => {
			stopCamera();
		};
	});
</script>

<div class="space-y-4">
	{#if error}
		<div class="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
			{error}
		</div>
	{/if}

	{#if !capturedImage}
		{#if isCameraActive}
			<!-- Camera View -->
			<div class="relative overflow-hidden rounded-lg bg-black">
				<video
					bind:this={videoElement}
					autoplay
					playsinline
					class="w-full"
					style="transform: scaleX(-1);"
				></video>
				<canvas bind:this={canvasElement} class="hidden"></canvas>

				<div class="absolute right-0 bottom-4 left-0 flex justify-center gap-3">
					<button
						onclick={capturePhoto}
						class="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
						aria-label="Capturar foto"
					>
						<div class="h-12 w-12 rounded-full border-4 border-gray-800"></div>
					</button>
					<button
						onclick={stopCamera}
						class="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700"
						aria-label="Cancelar"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>
			</div>
		{:else}
			<!-- Camera Buttons -->
			<div class="flex flex-col gap-3 sm:flex-row">
				<button
					onclick={startCamera}
					class="bg-primary-600 hover:bg-primary-700 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 text-white transition-colors"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
						></path>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
						></path>
					</svg>
					{label}
				</button>

				<label
					class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
					Escolher da Galeria
					<input type="file" accept="image/*" onchange={handleFileInput} class="hidden" />
				</label>
			</div>
		{/if}
	{:else}
		<!-- Preview -->
		<div class="space-y-3">
			<div class="overflow-hidden rounded-lg">
				<img src={capturedImage} alt="Foto capturada" class="w-full" />
			</div>
			<button
				onclick={retake}
				class="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
			>
				Tirar Outra Foto
			</button>
		</div>
	{/if}
</div>
