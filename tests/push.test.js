import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  native: true,
  requestPermissions: vi.fn(),
  getToken: vi.fn(),
  createChannel: vi.fn(),
  subscribeToTopic: vi.fn(),
  unsubscribeFromTopic: vi.fn(),
  deleteToken: vi.fn(),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => mock.native },
}));
vi.mock("@capacitor-firebase/messaging", () => ({ FirebaseMessaging: mock }));
import { usePushNotifications } from "../src/composables/usePushNotifications";
beforeEach(() => {
  vi.clearAllMocks();
  mock.native = true;
  mock.requestPermissions.mockResolvedValue({ receive: "granted" });
  mock.subscribeToTopic.mockResolvedValue();
  mock.unsubscribeFromTopic.mockResolvedValue();
  const data = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  });
});
describe("notifiche per città", () => {
  it("iscrive solo alla città scelta", async () => {
    await usePushNotifications().subscribeToCity("milano");
    expect(mock.subscribeToTopic).toHaveBeenCalledWith({
      topic: "city_milano",
    });
    expect(localStorage.getItem("pickalert_push_city")).toBe("milano");
  });
  it("rimuove la vecchia città prima di iscrivere alla nuova", async () => {
    localStorage.setItem("pickalert_push_city", "roma");
    await usePushNotifications().subscribeToCity("milano");
    expect(mock.unsubscribeFromTopic).toHaveBeenCalledWith({
      topic: "city_roma",
    });
    expect(mock.unsubscribeFromTopic.mock.invocationCallOrder[0]).toBeLessThan(
      mock.subscribeToTopic.mock.invocationCallOrder[0],
    );
  });
  it("non iscrive alla nuova città se fallisce la rimozione della vecchia", async () => {
    localStorage.setItem("pickalert_push_city", "roma");
    mock.unsubscribeFromTopic.mockRejectedValueOnce(new Error("offline"));
    await expect(
      usePushNotifications().subscribeToCity("milano"),
    ).rejects.toThrow("offline");
    expect(mock.subscribeToTopic).not.toHaveBeenCalled();
    expect(localStorage.getItem("pickalert_push_city")).toBe("roma");
  });
  it("non dichiara attive le notifiche con permesso negato", async () => {
    mock.requestPermissions.mockResolvedValue({ receive: "denied" });
    await expect(
      usePushNotifications().subscribeToCity("milano"),
    ).rejects.toThrow("Consenti");
    expect(mock.getToken).not.toHaveBeenCalled();
    expect(localStorage.getItem("pickalert_push_city")).toBeNull();
  });
  it("disiscrive e rimuove il token alla disattivazione", async () => {
    localStorage.setItem("pickalert_push_city", "roma");
    await usePushNotifications().unsubscribe();
    expect(mock.unsubscribeFromTopic).toHaveBeenCalledWith({
      topic: "city_roma",
    });
    expect(mock.deleteToken).toHaveBeenCalled();
    expect(localStorage.getItem("pickalert_push_city")).toBeNull();
  });
  it("sul web non simula una iscrizione push riuscita", async () => {
    mock.native = false;
    await expect(
      usePushNotifications().subscribeToCity("milano"),
    ).rejects.toThrow("Android");
    expect(mock.requestPermissions).not.toHaveBeenCalled();
  });
});
