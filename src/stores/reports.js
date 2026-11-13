import { defineStore } from "pinia";
import { supabase } from "../lib/supabase";

export const useReportsStore = defineStore("reports", {
  state: () => ({
    reports: [],
    loading: false,
    channel: null,
    error: null,
    requestId: 0,
  }),
  actions: {
    async fetchReports(cityId = null) {
      const requestId = ++this.requestId;
      if (
        !cityId ||
        (typeof navigator !== "undefined" && navigator.onLine === false)
      ) {
        this.reports = [];
        this.loading = false;
        this.error = null;
        return;
      }
      this.loading = true;
      this.error = null;
      let query = supabase
        .from("reports")
        .select("*, report_tags(pattern_tag_id, pattern_tags(label))")
        .eq("status", "approved")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (cityId) query = query.eq("city_id", cityId);

      const { data, error } = await query;
      if (requestId !== this.requestId) return;
      if (!error) this.reports = data;
      else {
        this.reports = [];
        this.error = "Impossibile caricare le segnalazioni. Riprova tra poco.";
      }
      this.loading = false;
    },

    // Sottoscrizione realtime: aggiorna il feed live quando arrivano nuove
    // segnalazioni approvate (utile in aggiunta alle push, per chi ha l'app aperta)
    subscribeRealtime(cityId = null) {
      if (this.channel) supabase.removeChannel(this.channel);
      if (!cityId) {
        this.channel = null;
        return;
      }

      this.channel = supabase
        .channel("reports-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reports" },
          (payload) => {
            if (payload.eventType === "DELETE") {
              this.reports = this.reports.filter(
                (r) => r.id !== payload.old.id,
              );
              return;
            }
            const row = payload.new;
            const isRelevant =
              row.status === "approved" && (!cityId || row.city_id === cityId);

            if (isRelevant) {
              this.fetchReports(cityId); // re-fetch per avere i join sui tag
            } else {
              this.reports = this.reports.filter((r) => r.id !== row.id);
            }
          },
        )
        .subscribe();
    },

    unsubscribeRealtime() {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
    },

    async createReport({
      cityId,
      description,
      locationType,
      locationLabel,
      aggressionLevel,
      armed,
      groupSize,
    }) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        throw new Error("Sei offline. Connettiti per inviare la segnalazione.");
      }
      const { error } = await supabase.from("reports").insert({
        city_id: cityId,
        description,
        location_type: locationType,
        location_label: locationLabel,
        aggression_level: aggressionLevel,
        armed,
        group_size: groupSize,
      });
      if (error) throw error;
    },
  },
});
