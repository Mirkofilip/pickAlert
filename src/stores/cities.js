import { defineStore } from "pinia";
import { supabase } from "../lib/supabase";

export const useCitiesStore = defineStore("cities", {
  state: () => ({
    cities: [],
    selectedCityId: localStorage.getItem("pickalert_city") || null,
    loaded: false,
    error: null,
  }),
  actions: {
    async fetchCities() {
      if (this.loaded) return;
      this.error = null;
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .order("name");
      if (!error) {
        this.cities = data;
        this.loaded = true;
      } else {
        this.error =
          "Impossibile caricare le città. Controlla la connessione e riprova.";
      }
    },
    selectCity(cityId) {
      this.selectedCityId = cityId;
      if (cityId) {
        localStorage.setItem("pickalert_city", cityId);
      } else {
        localStorage.removeItem("pickalert_city");
      }
    },
  },
});
