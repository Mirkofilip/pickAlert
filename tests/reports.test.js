import { beforeEach, it, expect, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
const db = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn() }));
vi.mock("../src/lib/supabase", () => ({ supabase: db }));
import { useReportsStore } from "../src/stores/reports";
beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  db.from.mockReturnValue({ insert: db.insert });
  db.insert.mockResolvedValue({ error: null });
});
it("invia solo dettagli del fatto, senza identità, foto o posizione del device", async () => {
  await useReportsStore().createReport({
    cityId: "milano",
    description: "Episodio osservato",
    locationType: "metro",
    locationLabel: "Duomo",
    aggressionLevel: "moderato",
    armed: false,
    groupSize: null,
    userId: "secret",
    lat: 45,
    lng: 9,
    photoFile: "photo",
  });
  expect(db.insert).toHaveBeenCalledWith({
    city_id: "milano",
    description: "Episodio osservato",
    location_type: "metro",
    location_label: "Duomo",
    aggression_level: "moderato",
    armed: false,
    group_size: null,
  });
});
it("non mostra successo se Supabase rifiuta la segnalazione", async () => {
  db.insert.mockResolvedValue({ error: new Error("RLS") });
  await expect(
    useReportsStore().createReport({ cityId: "milano" }),
  ).rejects.toThrow("RLS");
});

it("non invia né accoda la segnalazione quando il dispositivo è offline", async () => {
  vi.stubGlobal("navigator", { onLine: false });
  try {
    await expect(
      useReportsStore().createReport({ cityId: "milano" }),
    ).rejects.toThrow("offline");
    expect(db.insert).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});

it("rimuove i vecchi dati del feed offline senza richiedere una cache", async () => {
  vi.stubGlobal("navigator", { onLine: false });
  try {
    const store = useReportsStore();
    store.reports = [{ id: "vecchio-avviso" }];
    await store.fetchReports("milano");
    expect(store.reports).toEqual([]);
    expect(store.loading).toBe(false);
    expect(db.from).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});
