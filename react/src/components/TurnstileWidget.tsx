import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Cloudflare Turnstile global typings
// ---------------------------------------------------------------------------
declare global {
    interface Window {
        turnstile?: {
            render(
                container: string | HTMLElement,
                params: TurnstileRenderParams,
            ): string;
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
    size?: "normal" | "compact" | "flexible";
}

// ---------------------------------------------------------------------------
// Script loader — loads the Turnstile JS once per page
// ---------------------------------------------------------------------------
const SCRIPT_URL =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_ID = "__hj_turnstile_script__";

function ensureTurnstileScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") {
            resolve();
            return;
        }
        // Already loaded
        if (window.turnstile) {
            resolve();
            return;
        }
        // Script tag already in DOM — wait for it to finish loading
        if (document.getElementById(SCRIPT_ID)) {
            const poll = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(poll);
                    resolve();
                }
            }, 50);
            return;
        }
        // First time — inject the script
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error("Failed to load Cloudflare Turnstile script"));
        document.head.appendChild(script);
    });
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Handle returned by the `ref` prop — lets the parent call `reset()`. */
export interface TurnstileWidgetHandle {
    /** Reset the challenge (clears the token; user must solve again). */
    reset: () => void;
}

export interface TurnstileWidgetProps {
    /** Cloudflare Turnstile site key (public). */
    siteKey: string;
    /** Called once the user passes the challenge, with the verification token. */
    onVerify: (token: string) => void;
    /** Called on challenge error. */
    onError?: () => void;
    /** Called when the token expires. */
    onExpire?: () => void;
    /** Widget color theme. Defaults to "auto". */
    theme?: "light" | "dark" | "auto";
    /** Widget appearance mode ("always" | "execute" | "interaction-only"). */
    appearance?: "always" | "execute" | "interaction-only";
    /** Extra inline styles for the container div. */
    style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a Cloudflare Turnstile widget.
 *
 * Loads the Turnstile JS once and uses explicit rendering so it works inside
 * any container (including modal dialogs that mount after page load).
 *
 * @example
 * ```tsx
 * const { onTurnstileVerify, turnstileRef } = useTurnstile();
 *
 * <TurnstileWidget
 *   siteKey="0x4AAAA..."
 *   onVerify={onTurnstileVerify}
 *   ref={turnstileRef}
 * />
 * ```
 */
export const TurnstileWidget = React.forwardRef<
    TurnstileWidgetHandle,
    TurnstileWidgetProps
>(function TurnstileWidget(
    { siteKey, onVerify, onError, onExpire, theme = "auto", appearance = "always", style },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    // Keep stable refs to callbacks so the effect closure is always current
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);
    useEffect(() => { onVerifyRef.current = onVerify; }, [onVerify]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);
    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    // Expose reset() via the forwarded ref
    React.useImperativeHandle(ref, () => ({
        reset() {
            if (window.turnstile && widgetIdRef.current !== null) {
                window.turnstile.reset(widgetIdRef.current);
            }
        },
    }));

    // Render (or re-render on siteKey / theme change)
    useEffect(() => {
        let cancelled = false;

        ensureTurnstileScript()
            .then(() => {
                if (cancelled || !containerRef.current || !window.turnstile) return;

                // Remove any previous widget in this container
                if (widgetIdRef.current !== null) {
                    try {
                        window.turnstile.remove(widgetIdRef.current);
                    } catch { /* ignore */ }
                    widgetIdRef.current = null;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: (token) => onVerifyRef.current(token),
                    "error-callback": () => onErrorRef.current?.(),
                    "expired-callback": () => onExpireRef.current?.(),
                    theme,
                    appearance,
                });
            })
            .catch(console.error);

        return () => {
            cancelled = true;
            if (window.turnstile && widgetIdRef.current !== null) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch { /* ignore */ }
                widgetIdRef.current = null;
            }
        };
    // Re-render only when key, theme or appearance change (not on callback change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey, theme, appearance]);

    return <div ref={containerRef} style={{ margin: "12px 0", ...style }} />;
});
