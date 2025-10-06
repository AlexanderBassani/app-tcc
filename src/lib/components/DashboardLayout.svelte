<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import Sidebar from './Sidebar.svelte';
	import UserDropdown from './UserDropdown.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen bg-gray-200 dark:bg-gray-800">
	<!-- Sidebar -->
	<Sidebar />

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header class="bg-white shadow-sm dark:bg-gray-700">
			<div class="flex h-16 items-center justify-between px-6">
				<div>
					<h1 class="text-2xl font-semibold text-gray-800 dark:text-white">Dashboard</h1>
				</div>
				<div class="flex items-center gap-3">
					<ThemeToggle />
					<UserDropdown />
				</div>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto bg-gray-200 p-6 dark:bg-gray-800">
			{@render children()}
		</main>
	</div>
</div>
