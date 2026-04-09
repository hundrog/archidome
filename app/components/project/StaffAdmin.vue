<script setup lang="ts">
type Database = import("@/types/database.types").Database;
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileProjectRow = Database["public"]["Tables"]["profile_projects"]["Row"];

type ProjectFull = ProjectRow & {
  campaigns: (CampaignRow & {
    profiles?: Pick<ProfileRow, "username" | "avatar_url">;
  })[];
  profile_projects: (ProfileProjectRow & {
    profiles: Pick<ProfileRow, "id" | "username" | "avatar_url">;
  })[];
};
const props = defineProps<{
  project: ProjectFull;
}>();

const emit = defineEmits(["refresh"]);
const supabase = useSupabaseClient();
const toast = useToast();
const { t } = useI18n();
const loadingId = ref<string | null>(null);

const members = computed(
  () =>
    props.project.profile_projects?.filter((m) => m.status === "accepted") ||
    [],
);

const pendingRequests = computed(
  () =>
    props.project.profile_projects?.filter((m) => m.status === "pending") || [],
);

async function updateStatus(
  profileId: string,
  newStatus: "accepted" | "rejected" | "deleted",
) {
  loadingId.value = profileId;
  try {
    if (newStatus === "deleted" || newStatus === "rejected") {
      const { error } = await supabase
        .from("profile_projects")
        .delete()
        .match({ project_id: props.project.id, profile_id: profileId });

      if (error) throw error;
      toast.add({ title: t("project.staff.memberRemoved"), color: "success" });
    } else {
      const { error } = await supabase
        .from("profile_projects")
        .update({ status: newStatus })
        .match({ project_id: props.project.id, profile_id: profileId });

      if (error) throw error;
      toast.add({ title: t("project.staff.masterAccepted"), color: "success" });
    }

    emit("refresh");
  } catch (err: any) {
    toast.add({
      title: t("common.error"),
      description: err.message,
      color: "error",
    });
  } finally {
    loadingId.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <section v-if="pendingRequests.length > 0" class="space-y-3">
      <h3
        class="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2"
      >
        <UIcon name="i-lucide-bell-ring" class="animate-pulse" />
        {{ $t("project.staff.pendingTitle") }}
      </h3>

      <div class="grid gap-2">
        <div
          v-for="req in pendingRequests"
          :key="req.profiles.id"
          class="p-4 flex items-center justify-between group card card-hoverable bg-tertiary/50"
        >
          <div class="flex items-center gap-3">
            <UAvatar :src="req.profiles.avatar_url || ''" size="sm" />
            <span class="text-sm font-medium text-gray-200">{{
              req.profiles.username
            }}</span>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="soft"
              size="xs"
              :loading="loadingId === req.profiles.id"
              @click="updateStatus(req.profiles.id, 'accepted')"
            />
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="soft"
              size="xs"
              :loading="loadingId === req.profiles.id"
              @click="updateStatus(req.profiles.id, 'rejected')"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h3
        class="text-sm font-bold text-on-surface-dim uppercase tracking-widest"
      >
        {{ $t("project.staff.mastersTitle") }}
      </h3>

      <div
        v-for="member in members"
        :key="member.profiles.id"
        class="p-4 flex items-center justify-between group card card-hoverable"
      >
        <div class="flex items-center gap-3">
          <UAvatar :src="member.profiles.avatar_url || ''" />
          <div>
            <p class="text-sm font-bold text-white">
              {{ member.profiles.username }}
            </p>
            <p
              v-if="member.owner"
              class="text-[10px] text-primary-500 font-black uppercase"
            >
              {{ $t("project.staff.architect") }}
            </p>
            <p v-else class="text-[10px] text-gray-500 uppercase">
              {{ $t("project.staff.master") }}
            </p>
          </div>
        </div>

        <UButton
          v-if="!member.owner"
          icon="i-lucide-user-minus"
          color="error"
          variant="ghost"
          size="sm"
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          :loading="loadingId === member.profiles.id"
          @click="updateStatus(member.profiles.id, 'deleted')"
        />
      </div>
    </section>
  </div>
</template>
