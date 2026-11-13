import { defineStore } from "pinia";
import { supabase } from "../lib/supabase";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    loading: true,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isModerator: (state) =>
      state.profile?.role === "moderator" || state.profile?.role === "admin",
    isAdmin: (state) => state.profile?.role === "admin",
  },
  actions: {
    async init() {
      this.loading = true;
      const { data } = await supabase.auth.getSession();
      this.user = data.session?.user ?? null;
      if (this.user) await this.fetchProfile();

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") return;
        const changed = this.user?.id !== session?.user?.id;
        this.user = session?.user ?? null;
        if (!this.user) this.profile = null;
        else if (changed) {
          this.profile = null;
          setTimeout(() => this.fetchProfile(), 0);
        }
      });
      this.loading = false;
    },

    async fetchProfile() {
      if (!this.user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", this.user.id)
        .single();

      this.profile = error ? null : data;
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      this.user = data.user;
      await this.fetchProfile();
      return data;
    },

    async signOut() {
      await supabase.auth.signOut();
      this.user = null;
      this.profile = null;
    },
  },
});
