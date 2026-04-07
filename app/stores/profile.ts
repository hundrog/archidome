import type { Database } from "@/types/database.types";
import type { ProfileForm } from "~/schemas/profile";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

const loading = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);

export const useProfileStore = defineStore("profile", () => {
  const currentProfile = ref<Profile | null>(null);

  const form = reactive<Partial<ProfileForm>>({
    username: "",
    full_name: "",
    bio: "",
    discord: "",
    whatsapp: "",
    instagram: "",
    twitter: "",
    website: "",
  });

  const fetchProfileById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { data, error: errorData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (errorData) throw errorData;
      currentProfile.value = data as Profile;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (payload: ProfileInsert) => {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { error: errorData } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", payload.id);

      if (errorData) throw errorData;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const resetProfile = () => {
    currentProfile.value = null;
    form.username = "";
    form.full_name = "";
    form.bio = "";
    form.discord = "";
    form.whatsapp = "";
    form.instagram = "";
    form.twitter = "";
    form.website = "";
  };

  return {
    form,
    currentProfile,
    loading,
    uploading,
    error,
    fetchProfileById,
    updateProfile,
    resetProfile,
  };
});
