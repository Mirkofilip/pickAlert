import { defineStore } from "pinia";
import { supabase } from "../lib/supabase";

export const useModerationStore = defineStore("moderation", {
  state: () => ({
    pendingReports: [],
    allReports: [],
    tags: [],
    loading: false,
  }),
  actions: {
    async fetchPending() {
      this.loading = true;
      const { data, error } = await supabase
        .from("reports")
        .select("*, cities(name)")
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (error) throw error;
      this.pendingReports = data;
      this.loading = false;
    },

    // Tutte le segnalazioni (pending, approved, rejected), per la vista
    // di gestione completa: modifica e cancellazione.
    async fetchAll() {
      this.loading = true;
      const { data, error } = await supabase
        .from("reports")
        .select("*, cities(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      this.allReports = data;
      this.loading = false;
    },

    async approve(reportId) {
      const { error } = await supabase
        .from("reports")
        .update({ status: "approved" })
        .eq("id", reportId);
      if (error) throw error;
      this.pendingReports = this.pendingReports.filter(
        (r) => r.id !== reportId,
      );
      this._patchLocal(reportId, { status: "approved" });
    },

    async reject(reportId) {
      const { error } = await supabase
        .from("reports")
        .update({ status: "rejected" })
        .eq("id", reportId);
      if (error) throw error;
      this.pendingReports = this.pendingReports.filter(
        (r) => r.id !== reportId,
      );
      this._patchLocal(reportId, { status: "rejected" });
    },

    // Modifica testo/città/status di una segnalazione esistente
    async updateReport(reportId, fields) {
      const { error } = await supabase
        .from("reports")
        .update(fields)
        .eq("id", reportId);
      if (error) throw error;
      this._patchLocal(reportId, fields);
    },

    // Cancellazione definitiva (rimuove anche la riga, non solo lo status)
    async deleteReport(reportId) {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
      this.allReports = this.allReports.filter((r) => r.id !== reportId);
      this.pendingReports = this.pendingReports.filter(
        (r) => r.id !== reportId,
      );
    },

    _patchLocal(reportId, fields) {
      const idx = this.allReports.findIndex((r) => r.id === reportId);
      if (idx !== -1)
        this.allReports[idx] = { ...this.allReports[idx], ...fields };
    },

    async fetchTags() {
      const { data, error } = await supabase
        .from("pattern_tags")
        .select("*")
        .order("label");
      if (!error) this.tags = data;
    },

    async createTag({ label, description, cityId }) {
      const { data, error } = await supabase
        .from("pattern_tags")
        .insert({ label, description, city_id: cityId })
        .select()
        .single();
      if (error) throw error;
      this.tags.push(data);
      return data;
    },
  },
});
