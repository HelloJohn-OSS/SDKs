import { useState, useCallback, useRef } from "react";
import type { TurnstileWidgetHandle } from "../components/TurnstileWidget";

export interface UseTurnstileReturn {
    /** Current challenge token — null until the user passes the challenge */
    turnstileToken: string | null;
    /** Pass this as `onVerify` prop to TurnstileWidget */
    onTurnstileVerify: (token: string) => void;
    /** Call after a failed submit to reset the widget and clear the token */
    resetTurnstile: () => void;
    /** Attach to TurnstileWidget via `ref` prop for programmatic reset */
    turnstileRef: React.RefObject<TurnstileWidgetHandle>;
}

/**
 * Manages Cloudflare Turnstile challenge state.
 *
 * @example
 * ```tsx
 * const { turnstileToken, onTurnstileVerify, resetTurnstile, turnstileRef } = useTurnstile();
 *
 * // In JSX (conditional on config):
 * {botEnabled && (
 *   <TurnstileWidget siteKey={siteKey} onVerify={onTurnstileVerify} ref={turnstileRef} />
 * )}
 *
 * // In submit handler:
 * await login(email, password, turnstileToken ?? undefined);
 * // On error:
 * resetTurnstile();
 * ```
 */
export function useTurnstile(): UseTurnstileReturn {
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    // useRef<T>(null) gives RefObject<T> (current: T | null) which is assignable to Ref<T>
    const turnstileRef = useRef<TurnstileWidgetHandle>(null);

    const onTurnstileVerify = useCallback((token: string) => {
        setTurnstileToken(token);
    }, []);

    const resetTurnstile = useCallback(() => {
        setTurnstileToken(null);
        turnstileRef.current?.reset();
    }, []);

    return { turnstileToken, onTurnstileVerify, resetTurnstile, turnstileRef };
}
