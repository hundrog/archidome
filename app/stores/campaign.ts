import { defineStore } from "pinia";
import { useSupabaseClient } from "#imports";
import type { Database } from "@/types/database.types";
import type { CampaignForm } from "~/schemas/campaign";

type Campaign = Omit<
  Database["public"]["Tables"]["campaigns"]["Row"],
  "house_rules"
> & {
  house_rules: unknown | null;
};
type CampaignInsert = Database["public"]["Tables"]["campaigns"]["Insert"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

// Helper function for distance calculation
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dO = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dO / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function campaignMatchesSearch(campaign: Campaign, q: string): boolean {
  return (
    campaign.title.toLowerCase().includes(q) ||
    campaign.system.toLowerCase().includes(q) ||
    (campaign.description?.toLowerCase().includes(q) ?? false)
  );
}

interface CampaignStoreState {
  // Campaign data
  campaigns: Campaign[];
  currentCampaign: Campaign | null;

  // Form state
  form: Partial<CampaignForm>;
  isEditMode: boolean;

  // Image handling
  imageFile: File | null;
  imagePreview: string | null;
  existingImageUrl: string | null;
  shouldDeleteExistingImage: boolean;

  // Location
  locationName: string;
  resolvedCoords: { lat: number; lng: number } | null;

  // Filtering (Grid page)
  searchQuery: string;
  modeFilter: string | null;
  radiusKm: number;
  nearbyOnly: boolean;
  userCoords: { lat: number; lng: number } | null;

  // Projects
  projects: Project[];

  // UI states
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

export const useCampaignStore = defineStore("campaign", () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const campaigns = ref<Campaign[]>([]);
  const currentCampaign = ref<Campaign | null>(null);

  const form = reactive<Partial<CampaignForm>>({
    title: "",
    system: "",
    hook: "",
    description: "",
    play_mode: "remote",
    virtual_platform: undefined,
    frequency: "weekly",
    language: "Español",
    timezone: undefined,
    duration: undefined,
    location_name: undefined,
    lat: null,
    lng: null,
    max_players: 4,
    start_level: 1,
    style_tags: [],
    house_rules: [],
    project_id: undefined,
    image: undefined,
  });
  const isEditMode = ref(false);

  const imageFile = ref<File | null>(null);
  const imagePreview = ref<string | null>(null);
  const existingImageUrl = ref<string | null>(null);
  const shouldDeleteExistingImage = ref(false);

  const locationName = ref("");
  const resolvedCoords = ref<{ lat: number; lng: number } | null>(null);

  const searchQuery = ref("");
  const modeFilter = ref<string | null>(null);
  const radiusKm = ref(5);
  const nearbyOnly = ref(false);
  const userCoords = ref<{ lat: number; lng: number } | null>(null);

  const projects = ref<Project[]>([]);

  const loading = ref(false);
  const uploading = ref(false);
  const error = ref<string | null>(null);

  // ─── Getters ──────────────────────────────────────────────────────────────
  const showLocation = computed(
    () => form.play_mode === "in_person" || form.play_mode === "hybrid"
  );

  const playModeOptions = computed(() => [
    { label: "Remoto", value: "remote" },
    { label: "Presencial", value: "in_person" },
    { label: "Híbrido", value: "hybrid" },
  ]);

  const projectOptions = computed(() =>
    projects.value.map((p) => ({ label: p.name, value: p.id }))
  );

  const filteredCampaigns = computed(() => {
    let list = campaigns.value;

    // Search filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      list = list.filter((c) => campaignMatchesSearch(c, q));
    }

    // Mode filter
    if (modeFilter.value) {
      list = list.filter((c) => c.play_mode === modeFilter.value);
    }

    // Proximity filter
    if (nearbyOnly.value && userCoords.value) {
      list = list.filter((c) => {
        if (c.play_mode === "remote") return true;
        if (!c.lat || !c.lng) return false;
        return (
          distanceKm(
            userCoords.value!.lat,
            userCoords.value!.lng,
            c.lat,
            c.lng,
          ) <= radiusKm.value
        );
      });

      // Sort by distance
      list = [...list].sort((a, b) => {
        if (a.play_mode === "remote") return 1;
        if (b.play_mode === "remote") return -1;
        if (!a.lat || !b.lat) return 0;
        return (
          distanceKm(
            userCoords.value!.lat,
            userCoords.value!.lng,
            a.lat!,
            a.lng!,
          ) -
          distanceKm(
            userCoords.value!.lat,
            userCoords.value!.lng,
            b.lat!,
            b.lng!,
          )
        );
      });
    }

    return list;
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  // Campaigns
  function getDistance(campaign: Campaign): string | null {
    if (!nearbyOnly.value || !userCoords.value || !campaign.lat || !campaign.lng)
      return null;
    const km = distanceKm(
      userCoords.value.lat,
      userCoords.value.lng,
      campaign.lat,
      campaign.lng,
    );
    return km < 1 ? `${Math.round(km * 1000)} m` : `${Math.round(km)} km`;
  }

  async function fetchCampaigns() {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { data, error: errorData } = await supabase
        .from("campaigns")
        .select(
          "*, profiles!campaigns_profile_fkey(full_name, username, avatar_url)",
        )
        .order("created_at", { ascending: false });

      if (errorData) throw errorData;
      campaigns.value = (data ?? []) as Campaign[];
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCampaignById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { data, error: errorData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (errorData) throw errorData;
      currentCampaign.value = data as Campaign;
      existingImageUrl.value = data.image_url;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function createCampaign(payload: CampaignInsert) {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { error: errorData } = await supabase
        .from("campaigns")
        .insert(payload);

      if (errorData) throw errorData;

      // Refresh campaigns list
      await fetchCampaigns();

      // Reset form
      resetForm();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCampaign(id: string, payload: CampaignInsert) {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { error: errorData } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", id);

      if (errorData) throw errorData;

      // Update current campaign
      if (currentCampaign.value) {
        currentCampaign.value = { ...currentCampaign.value, ...payload };
      }

      // Reset edit state
      isEditMode.value = false;
      resetForm();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCampaign(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();

      // Delete image if exists
      if (currentCampaign.value?.image_url) {
        await deleteImageFromBucket(currentCampaign.value.image_url);
      }

      const { error: errorData } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (errorData) throw errorData;

      // Refresh campaigns list
      campaigns.value = campaigns.value.filter((c) => c.id !== id);
      currentCampaign.value = null;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Projects
  async function fetchProjects() {
    loading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const { data, error: errorData } = await supabase
        .from("projects")
        .select("id, name");

      if (errorData) throw errorData;
      projects.value = (data ?? []) as Project[];
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  // Image Handling
  async function uploadImage(file: File): Promise<string> {
    uploading.value = true;
    error.value = null;
    try {
      const supabase = useSupabaseClient();
      const ext = file.name.split(".").pop();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: errorData } = await supabase.storage
        .from("campaign-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (errorData)
        throw new Error(`Error al subir imagen: ${errorData.message}`);

      const { data } = supabase.storage
        .from("campaign-images")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      uploading.value = false;
    }
  }

  async function deleteImageFromBucket(imageUrl: string) {
    try {
      const supabase = useSupabaseClient();
      const path = imageUrl.split("/campaign-images/")[1];
      if (path) {
        const { error: errorData } = await supabase.storage
          .from("campaign-images")
          .remove([path]);
        if (errorData) console.warn("Error eliminando imagen:", errorData);
      }
    } catch (err: any) {
      console.warn("Error eliminando imagen:", err);
    }
  }

  function setImage(file: File | null) {
    imageFile.value = file;
    if (file) {
      imagePreview.value = URL.createObjectURL(file);
    } else {
      imagePreview.value = null;
    }
  }

  function removeImage() {
    imageFile.value = null;
    if (imagePreview.value?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview.value);
    }
    imagePreview.value = null;
    shouldDeleteExistingImage.value = true;
  }

  // Form Handling
  function setFormField(key: string, value: any) {
    (form as any)[key] = value;
  }

  function setLocation(
    locName: string,
    coords: { lat: number; lng: number } | null,
  ) {
    locationName.value = locName;
    form.location_name = locName;
    resolvedCoords.value = coords;
    if (coords) {
      form.lat = coords.lat;
      form.lng = coords.lng;
    }
  }

  function setEditMode(campaignId: string) {
    isEditMode.value = true;
  }

  function resetForm() {
    Object.assign(form, {
      title: "",
      system: "",
      hook: "",
      description: "",
      play_mode: "remote",
      virtual_platform: undefined,
      frequency: undefined,
      language: "Español",
      timezone: undefined,
      duration: undefined,
      location_name: undefined,
      lat: null,
      lng: null,
      max_players: 4,
      start_level: 1,
      style_tags: [],
      house_rules: [],
      project_id: undefined,
      image: undefined,
    });
    imageFile.value = null;
    imagePreview.value = null;
    existingImageUrl.value = null;
    shouldDeleteExistingImage.value = false;
    locationName.value = "";
    resolvedCoords.value = null;
    isEditMode.value = false;
    error.value = null;
  }

  // Filtering (Grid)
  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setModeFilter(mode: string | null) {
    modeFilter.value = mode;
  }

  function setRadiusKm(radius: number) {
    radiusKm.value = radius;
  }

  function setNearbyOnly(value: boolean) {
    nearbyOnly.value = value;
  }

  function setUserCoords(coords: { lat: number; lng: number } | null) {
    userCoords.value = coords;
  }

  // ─── Return public API ─────────────────────────────────────────────────────
  return {
    // State
    campaigns,
    currentCampaign,
    form,
    isEditMode,
    imageFile,
    imagePreview,
    existingImageUrl,
    shouldDeleteExistingImage,
    locationName,
    resolvedCoords,
    searchQuery,
    modeFilter,
    radiusKm,
    nearbyOnly,
    userCoords,
    projects,
    loading,
    uploading,
    error,

    // Getters
    showLocation,
    playModeOptions,
    projectOptions,
    filteredCampaigns,

    // Actions
    getDistance,
    fetchCampaigns,
    fetchCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    fetchProjects,
    uploadImage,
    deleteImageFromBucket,
    setImage,
    removeImage,
    setFormField,
    setLocation,
    setEditMode,
    resetForm,
    setSearchQuery,
    setModeFilter,
    setRadiusKm,
    setNearbyOnly,
    setUserCoords,
  };
});
