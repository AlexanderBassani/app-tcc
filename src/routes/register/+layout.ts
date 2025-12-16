import { redirect } from '@sveltejs/kit';
import { authStore } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

export const load = async () => {
    if (browser) {
        const auth = get(authStore);
        if (auth.isAuthenticated && auth.token) {
            throw redirect(302, '/');
        }
    }
};
