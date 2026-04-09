<script setup lang="ts">
const route = useRoute();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const { t } = useI18n();
const slug = route.params.slug as string;

const project = ref<any>(null);
const loading = ref(true);
const sendingRequest = ref(false);
const alreadyMember = ref(false);

async function fetchProjectData() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("projects")
      .select(
        `
        id, 
        name, 
        created_at,
        profiles!projects_created_by_fkey (
          username,
          avatar_url
        )
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) throw error;
    project.value = data;

    if (user.value) {
      const { data: memberData } = await supabase
        .from("profile_projects")
        .select("status")
        .eq("project_id", data.id)
        .eq("profile_id", user.value.sub)
        .single();

      if (memberData) alreadyMember.value = true;
    }
  } catch (err: any) {
    toast.add({ title: t("pages.join.notFound"), color: "error" });
    await navigateTo("/");
  } finally {
    loading.value = false;
  }
}

fetchProjectData();

async function requestJoin() {
  if (!user.value) {
    return navigateTo("/login");
  }

  console.log(user.value);

  sendingRequest.value = true;
  try {
    const { error } = await supabase.from("profile_projects").insert({
      project_id: project.value.id,
      profile_id: user.value.sub,
      status: "pending",
      owner: false,
    });

    if (error) throw error;

    alreadyMember.value = true;
    toast.add({
      title: t("pages.join.requestSent"),
      description: t("pages.join.requestSentDesc"),
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: t("pages.join.requestError"),
      description: err.message,
      color: "error",
    });
  } finally {
    sendingRequest.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto py-12 px-4">
    <UCard v-if="!loading && project" class="bg-gray-900 border-gray-800">
      <div class="space-y-6 text-center">
        <div class="space-y-2">
          <UIcon
            name="i-lucide-scroll-text"
            class="size-12 text-primary-500 mx-auto"
          />
          <h1 class="text-3xl font-bold text-white">{{ project.name }}</h1>
          <p class="text-gray-400">
            {{ $t("pages.join.inviteTitle") }}
          </p>
        </div>

        <USeparator />

        <div class="flex items-center justify-center gap-3">
          <UAvatar
            :src="project.profiles?.avatar_url"
            :alt="project.profiles?.username"
            size="sm"
          />
          <div class="text-left">
            <p
              class="text-xs text-gray-500 uppercase font-bold tracking-tighter"
            >
              {{ $t("pages.join.createdBy") }}
            </p>
            <p class="text-sm text-gray-200">
              {{
                project.profiles?.username || $t("pages.join.anonymousUser")
              }}
            </p>
          </div>
        </div>

        <div class="pt-4">
          <UButton
            v-if="!alreadyMember"
            :label="$t('pages.join.requestJoin')"
            icon="i-lucide-send"
            size="xl"
            block
            :loading="sendingRequest"
            @click="requestJoin()"
          />
          <div
            v-else
            class="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center gap-2"
          >
            <UIcon name="i-lucide-clock" />
            <span>{{ $t("pages.join.pendingMember") }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <div v-else class="space-y-4">
      <USkeleton class="h-64 w-full rounded-xl" />
    </div>
  </div>
</template>
