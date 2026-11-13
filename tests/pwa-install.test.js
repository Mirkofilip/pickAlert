import { beforeEach, it, expect, vi } from "vitest";
let listeners;
beforeEach(() => {
  vi.resetModules();
  listeners = new Map();
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: false }),
    addEventListener: (type, handler) => listeners.set(type, handler),
  });
  vi.stubGlobal("navigator", { standalone: false });
});

it("non chiede installazione o notifiche automaticamente all’apertura", async () => {
  const { usePwaInstall } = await import("../src/composables/usePwaInstall");
  const state = usePwaInstall();
  expect(state.installEvent.value).toBeNull();
  expect(state.installed.value).toBe(false);
  await state.install();
  expect(listeners.has("beforeinstallprompt")).toBe(true);
});

it("presenta la richiesta solo dopo l’azione dell’utente e attende installazione effettiva", async () => {
  const { usePwaInstall } = await import("../src/composables/usePwaInstall");
  const event = {
    preventDefault: vi.fn(),
    prompt: vi.fn(),
    userChoice: Promise.resolve({ outcome: "accepted" }),
  };
  listeners.get("beforeinstallprompt")(event);
  const state = usePwaInstall();
  expect(event.prompt).not.toHaveBeenCalled();
  await state.install();
  expect(event.prompt).toHaveBeenCalledOnce();
  expect(state.installed.value).toBe(false);
  expect(state.installEvent.value).toBeNull();
  listeners.get("appinstalled")();
  expect(state.installed.value).toBe(true);
});

it("una richiesta ignorata può essere riproposta solo con un nuovo evento del browser", async () => {
  const { usePwaInstall } = await import("../src/composables/usePwaInstall");
  const event = {
    preventDefault: vi.fn(),
    prompt: vi.fn(),
    userChoice: Promise.resolve({ outcome: "dismissed" }),
  };
  listeners.get("beforeinstallprompt")(event);
  const state = usePwaInstall();
  await state.install();
  await state.install();
  expect(event.prompt).toHaveBeenCalledOnce();
  expect(state.installed.value).toBe(false);
});
