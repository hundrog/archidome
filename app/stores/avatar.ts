import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const useAvatarStore = defineStore("avatar", () => {
  const avatarUrl = ref<string | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  const error = ref<string | null>(null);

  async function fetchOnce(userId: string) {
    if (!userId || initialized.value || loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const supabase = useSupabaseClient<Database>();
      const { data, error: e } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (e) throw e;
      avatarUrl.value = (data as Pick<Profile, "avatar_url"> | null)?.avatar_url ?? null;
      initialized.value = true;
    } catch (err: any) {
      error.value = err?.message ?? "Failed to load avatar";
    } finally {
      loading.value = false;
    }
  }

  function setAvatar(url: string | null) {
    avatarUrl.value = url;
    initialized.value = true;
  }

  function reset() {
    avatarUrl.value = null;
    initialized.value = false;
    error.value = null;
    loading.value = false;
  }

  return { avatarUrl, loading, initialized, error, fetchOnce, setAvatar, reset };
});