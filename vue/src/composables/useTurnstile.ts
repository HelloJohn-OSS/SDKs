import { ref, type Ref } from "vue";

export interface UseTurnstileReturn {
    /** Current challenge token — null until the user passes the challenge. */
    turnstileToken: Ref<string | null>;
    /** Callback to pass to HjTurnstile's @verify event. */
    onTurnstileVerify: (token: string) => void;
    /** Reset the token and the widget (call after a failed submit). */
    resetTurnstile: () => void;
    /** Expose to HjTurnstile component via template ref for programmatic reset. */
    widgetRef: Ref<{ reset: () => void } | null>;
}

/**
 * Manages Cloudflare Turnstile challenge state.
 *
 * @example
 * ```vue
 * <script setup>
 * const { turnstileToken, onTurnstileVerify, resetTurnstile, widgetRef } = useTurnstile();
 *
 * async function handleLogin() {
 *   try {
 *     await loginWithPassword(email.value, password.value, turnstileToken.value ?? undefined);
 *   } catch {
 *     resetTurnstile();
 *   }
 * }
 * </script>
 *
 * <template>
 *   <HjTurnstile v-if="needsTurnstile" :site-key="siteKey" @verify="onTurnstileVerify" ref="widgetRef" />
 * </template>
 * ```
 */
export function useTurnstile(): UseTurnstileReturn {
    const turnstileToken = ref<string | null>(null);
    const widgetRef = ref<{ reset: () => void } | null>(null);

    function onTurnstileVerify(token: string) {
        turnstileToken.value = token;
    }

    function resetTurnstile() {
        turnstileToken.value = null;
        widgetRef.value?.reset();
    }

    return { turnstileToken, onTurnstileVerify, resetTurnstile, widgetRef };
}
