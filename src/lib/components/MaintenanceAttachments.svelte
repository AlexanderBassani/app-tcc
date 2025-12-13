<script lang="ts">
	import { maintenanceAttachmentsApi } from '$lib/api/maintenance-attachments';
	import { authStore } from '$lib/stores/auth';
	import type { MaintenanceAttachment } from '$lib/types/maintenance-attachment';
	import { onMount } from 'svelte';

	let { maintenanceId } = $props();

	let attachments = $state<MaintenanceAttachment[]>([]);
	let isLoadingList = $state(false);
	let isUploading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Estados para edição
	let editingId = $state<number | null>(null);
	let editingName = $state('');

	// Estados para upload
	let isDragging = $state(false);
	let selectedFiles = $state<File[]>([]);

	// Configurações de validação
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
	const MAX_FILES = 5;
	const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
	const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt'];

	onMount(() => {
		loadAttachments();
	});

	async function loadAttachments() {
		if (!maintenanceId) return;

		isLoadingList = true;
		errorMessage = '';

		try {
			const response = await maintenanceAttachmentsApi.listByMaintenance(
				maintenanceId,
				$authStore.token!
			);
			attachments = response.data;
		} catch (e: any) {
			console.error('Erro ao carregar anexos:', e);
			errorMessage = e.message || 'Erro ao carregar anexos';
		} finally {
			isLoadingList = false;
		}
	}

	function validateFile(file: File): string | null {
		// Validar tipo
		const extension = '.' + file.name.split('.').pop()?.toLowerCase();
		if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(extension)) {
			return `Tipo de arquivo não permitido: ${file.name}`;
		}

		// Validar tamanho
		if (file.size > MAX_FILE_SIZE) {
			return `Arquivo muito grande: ${file.name} (máx 10MB)`;
		}

		return null;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			addFiles(Array.from(input.files));
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		if (e.dataTransfer?.files) {
			addFiles(Array.from(e.dataTransfer.files));
		}
	}

	function addFiles(files: File[]) {
		errorMessage = '';

		// Validar quantidade total
		if (selectedFiles.length + files.length > MAX_FILES) {
			errorMessage = `Máximo de ${MAX_FILES} arquivos por upload`;
			return;
		}

		// Validar cada arquivo
		for (const file of files) {
			const error = validateFile(file);
			if (error) {
				errorMessage = error;
				return;
			}
		}

		// Adicionar arquivos válidos
		selectedFiles = [...selectedFiles, ...files];
	}

	function removeSelectedFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	async function handleUpload() {
		if (selectedFiles.length === 0) {
			errorMessage = 'Selecione pelo menos um arquivo';
			return;
		}

		isUploading = true;
		errorMessage = '';
		successMessage = '';

		try {
			await maintenanceAttachmentsApi.upload(maintenanceId, selectedFiles, $authStore.token!);
			successMessage = `${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`;
			selectedFiles = [];
			await loadAttachments();
		} catch (e: any) {
			console.error('Erro no upload:', e);
			errorMessage = e.message || 'Erro ao enviar arquivos';
		} finally {
			isUploading = false;
		}
	}

	async function handleDownload(attachment: MaintenanceAttachment) {
		try {
			await maintenanceAttachmentsApi.download(
				attachment.id,
				attachment.file_name,
				$authStore.token!
			);
		} catch (e: any) {
			console.error('Erro no download:', e);
			errorMessage = e.message || 'Erro ao baixar arquivo';
		}
	}

	function startEdit(attachment: MaintenanceAttachment) {
		editingId = attachment.id;
		editingName = attachment.file_name;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}

	async function saveEdit(id: number) {
		if (!editingName.trim()) {
			errorMessage = 'Nome do arquivo não pode estar vazio';
			return;
		}

		errorMessage = '';
		successMessage = '';

		try {
			await maintenanceAttachmentsApi.update(id, { file_name: editingName }, $authStore.token!);
			successMessage = 'Nome atualizado com sucesso!';
			editingId = null;
			editingName = '';
			await loadAttachments();
		} catch (e: any) {
			console.error('Erro ao atualizar:', e);
			errorMessage = e.message || 'Erro ao atualizar nome do arquivo';
		}
	}

	async function handleDelete(id: number, fileName: string) {
		if (!confirm(`Tem certeza que deseja excluir "${fileName}"?`)) {
			return;
		}

		errorMessage = '';
		successMessage = '';

		try {
			await maintenanceAttachmentsApi.delete(id, $authStore.token!);
			successMessage = 'Anexo excluído com sucesso!';
			await loadAttachments();
		} catch (e: any) {
			console.error('Erro ao excluir:', e);
			errorMessage = e.message || 'Erro ao excluir anexo';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString('pt-BR');
	}

	function getFileIcon(fileType: string): string {
		if (fileType.startsWith('image/')) return '🖼️';
		if (fileType === 'application/pdf') return '📄';
		if (fileType === 'text/plain') return '📝';
		return '📎';
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Anexos</h3>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			Envie arquivos relacionados a esta manutenção (máx 5 arquivos, 10MB cada)
		</p>
	</div>

	<!-- Messages -->
	{#if errorMessage}
		<div
			class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
		>
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div
			class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
		>
			{successMessage}
		</div>
	{/if}

	<!-- Upload Area -->
	<div class="rounded-lg border-2 border-dashed p-6 {isDragging
		? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
		: 'border-gray-300 dark:border-gray-600'}">
		<div
			class="space-y-4"
			ondragover={(e) => {
				e.preventDefault();
				isDragging = true;
			}}
			ondragleave={() => (isDragging = false)}
			ondrop={handleDrop}
		>
			<div class="text-center">
				<svg
					class="mx-auto h-12 w-12 text-gray-400"
					stroke="currentColor"
					fill="none"
					viewBox="0 0 48 48"
				>
					<path
						d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<div class="mt-4">
					<label
						for="file-upload"
						class="cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
					>
						Selecione arquivos
					</label>
					<input
						id="file-upload"
						type="file"
						class="sr-only"
						multiple
						accept={ALLOWED_EXTENSIONS.join(',')}
						onchange={handleFileSelect}
						disabled={isUploading}
					/>
					<span class="text-gray-600 dark:text-gray-400"> ou arraste e solte</span>
				</div>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
					PNG, JPG, GIF, PDF, TXT até 10MB (máx 5 arquivos)
				</p>
			</div>

			<!-- Selected Files -->
			{#if selectedFiles.length > 0}
				<div class="space-y-2">
					<p class="text-sm font-medium text-gray-700 dark:text-gray-300">
						Arquivos selecionados:
					</p>
					{#each selectedFiles as file, index}
						<div
							class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2 dark:bg-gray-700"
						>
							<div class="flex items-center space-x-3">
								<span class="text-2xl">{getFileIcon(file.type)}</span>
								<div>
									<p class="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">
										{formatFileSize(file.size)}
									</p>
								</div>
							</div>
							<button
								type="button"
								onclick={() => removeSelectedFile(index)}
								class="text-red-600 hover:text-red-800 dark:text-red-400"
								disabled={isUploading}
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					{/each}

					<button
						type="button"
						onclick={handleUpload}
						disabled={isUploading}
						class="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isUploading}
							<span class="flex items-center justify-center">
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								Enviando...
							</span>
						{:else}
							Enviar Arquivos
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Attachments List -->
	{#if isLoadingList}
		<div class="text-center py-8">
			<div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando anexos...</p>
		</div>
	{:else if attachments.length > 0}
		<div class="space-y-3">
			<p class="text-sm font-medium text-gray-700 dark:text-gray-300">
				Anexos salvos ({attachments.length}):
			</p>
			{#each attachments as attachment}
				<div
					class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-center space-x-3 flex-1 min-w-0">
						<span class="text-2xl">{getFileIcon(attachment.file_type)}</span>
						<div class="flex-1 min-w-0">
							{#if editingId === attachment.id}
								<input
									type="text"
									bind:value={editingName}
									class="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							{:else}
								<p class="text-sm font-medium text-gray-900 dark:text-white truncate">
									{attachment.file_name}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									{formatFileSize(attachment.file_size)} • {formatDate(attachment.uploaded_at)}
								</p>
							{/if}
						</div>
					</div>

					<div class="flex items-center space-x-2 ml-4">
						{#if editingId === attachment.id}
							<button
								type="button"
								onclick={() => saveEdit(attachment.id)}
								class="text-green-600 hover:text-green-800 dark:text-green-400"
								title="Salvar"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={cancelEdit}
								class="text-gray-600 hover:text-gray-800 dark:text-gray-400"
								title="Cancelar"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{:else}
							<button
								type="button"
								onclick={() => handleDownload(attachment)}
								class="text-blue-600 hover:text-blue-800 dark:text-blue-400"
								title="Baixar"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => startEdit(attachment)}
								class="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
								title="Editar nome"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => handleDelete(attachment.id, attachment.file_name)}
								class="text-red-600 hover:text-red-800 dark:text-red-400"
								title="Excluir"
							>
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8">
			<p class="text-sm text-gray-500 dark:text-gray-400">Nenhum anexo ainda</p>
		</div>
	{/if}
</div>
