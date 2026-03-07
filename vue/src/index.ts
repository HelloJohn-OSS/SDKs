export { createHelloJohn, HELLOJOHN_INJECTION_KEY } from "./plugin";

export { useAuth } from "./composables/useAuth";
export { useUser } from "./composables/useUser";
export { useTurnstile } from "./composables/useTurnstile";
export type { UseTurnstileReturn } from "./composables/useTurnstile";

export { default as HjSignIn } from "./components/HjSignIn.vue";
export { default as HjSignUp } from "./components/HjSignUp.vue";
export { default as HjUserButton } from "./components/HjUserButton.vue";
export { default as HjTurnstile } from "./components/HjTurnstile.vue";

export type {
  AuthState,
  HelloJohnContextValue,
  HelloJohnOptions,
  HelloJohnUser,
  LoginPasswordResult,
  SignUpResult
} from "./types";
