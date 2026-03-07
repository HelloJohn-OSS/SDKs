<template>
  <div ref="containerRef" class="hj-turnstile" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

// ---------------------------------------------------------------------------
// Cloudflare Turnstile global typings
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    turnstile?: {
      render(container: string | HTMLElement, params: TurnstileRenderParams): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
      getResponse(widgetId?: string): string | undefined;
    };
  }
}

interface TurnstileRenderParams {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  appearance?: "always" | "execute" | "interaction-only";
}

// ---------------------------------------------------------------------------
// Props and emits
// ---------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    /** Cloudflare Turnstile public site key. */
    siteKey: string;
    /** Widget color theme. */
    theme?: "light" | "dark" | "auto";
    /** Widget appearance mode. */
    appearance?: "always" | "execute" | "interaction-only";
  }>(),
  {
    theme: "auto",
    appearance: "always",
  }
);

const emit = defineEmits<{
  /** Emitted with the verification token once the user passes the challenge. */
  verify: [token: string];
  /** Emitted on widget error. */
  error: [];
  /** Emitted when the token expires. */
  expire: [];
}>();

// ---------------------------------------------------------------------------
// Script loader
// ---------------------------------------------------------------------------
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "__hj_turnstile_script__";

function ensureTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { resolve(); return; }
    if (window.turnstile) { resolve(); return; }
    if (document.getElementById(SCRIPT_ID)) {
      const poll = setInterval(() => {
        if (window.turnstile) { clearInterval(poll); resolve(); }
      }, 50);
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cloudflare Turnstile script"));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Widget logic
// ---------------------------------------------------------------------------
const containerRef = ref<HTMLDivElement | null>(null);
const widgetId = ref<string | null>(null);

function removeWidget() {
  if (window.turnstile && widgetId.value !== null) {
    try { window.turnstile.remove(widgetId.value); } catch { /* ignore */ }
    widgetId.value = null;
  }
}

async function renderWidget() {
  await ensureTurnstileScript();
  if (!containerRef.value || !window.turnstile) return;

  removeWidget();

  widgetId.value = window.turnstile.render(containerRef.value, {
    sitekey: props.siteKey,
    callback: (token: string) => emit("verify", token),
    "error-callback": () => emit("error"),
    "expired-callback": () => emit("expire"),
    theme: props.theme,
    appearance: props.appearance,
  });
}

// Public method exposed via defineExpose for the widgetRef pattern
function reset() {
  if (window.turnstile && widgetId.value !== null) {
    window.turnstile.reset(widgetId.value);
  }
}

defineExpose({ reset });

onMounted(() => { void renderWidget(); });
onBeforeUnmount(() => removeWidget());

// Re-render on siteKey or theme change
watch(() => [props.siteKey, props.theme, props.appearance], () => { void renderWidget(); });
</script>

<style scoped>
.hj-turnstile {
  margin: 10px 0;
}
</style>
