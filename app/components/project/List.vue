<!-- components/user/ProjectsList.vue -->
<script setup lang="ts">
import type { Database } from "@/types/database.types";
type Project = Database["public"]["Tables"]["projects"]["Row"];

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const config = useRuntimeConfig();
const { t } = useI18n();

const projects = ref<Project[]>([]);
const loading = ref(false);
const newName = ref("");
const creating = ref(false);
const showInviteModal = ref(false);
const projectToInvite = ref<Project | null>(null);

function openInviteModal(project: Project) {
  projectToInvite.value = project;
  showInviteModal.value = true;
}

async function copyInviteLink() {
  if (!projectToInvite.value?.slug) return;

  const url = `${config.public.clientUrl}/join/${projectToInvite.value.slug}`;

  try {
    await navigator.clipboard.writeText(url);
    toast.add({
      title: t("project.list.linkCopied"),
      description: t("project.list.linkCopiedDesc"),
      color: "success",
    });
  } catch (err) {
    toast.add({ title: t("project.list.copyError"), color: "error" });
  }
}

async function fetchProjects() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("profile_projects")
      .select(
        `
      owner,
      status,
      projects (
        id,
        name,
        slug,
        created_at
      )
    `,
      )
      .eq("profile_id", user.value!.sub)
      .or("owner.eq.true,status.eq.accepted")
      .order("created_at", { foreignTable: "projects", ascending: false });

    if (error) throw error;

    projects.value = data.map((item) => {
      const project = item.projects as unknown as Project;

      return {
        ...project,
        isOwner: item.owner,
        memberStatus: item.status,
      };
    });
  } catch (err: any) {
    toast.add({
      title: t("project.list.loadError"),
      description: err.message,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

await fetchProjects();

async function createProject() {
  if (!newName.value.trim()) return;
  creating.value = true;
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: newName.value.trim(), created_by: user.value!.id })
      .select()
      .single();

    if (error) throw error;

    projects.value.push(data);
    newName.value = "";
    toast.add({ title: t("project.list.created"), color: "success" });
  } catch (err: any) {
    toast.add({
      title: t("project.list.createError"),
      description: err.message,
      color: "error",
    });
  } finally {
    creating.value = false;
  }
}

let inviteChannel: any = null;
onMounted(() => {
  inviteChannel = supabase
    .channel("nuevas-solicitudes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "profile_projects",
        filter: `status=eq.pending`,
      },
      (payload) => {
        const newRequest = payload.new;

        const project = projects.value.find(
          (p) => p.id === newRequest.project_id,
        );

        if (project) {
          toast.add({
            title: t("project.list.newRequest"),
            description: t("project.list.newRequestDesc", { name: project.name }),
            color: "primary",
            actions: [
              {
                label: t("project.list.viewRequests"),
                onClick: () => {},
              },
            ],
          });
        }
      },
    )
    .subscribe();
});

onUnmounted(() => {
  if (inviteChannel) {
    supabase.removeChannel(inviteChannel);
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        {{ $t("project.list.newProject") }}
      </h3>
      <div class="flex gap-2">
        <UInput
          v-model="newName"
          :placeholder="$t('project.list.projectNamePlaceholder')"
          size="lg"
          class="flex-1"
          @keydown.enter="createProject"
        />
        <UButton
          icon="i-lucide-plus"
          size="lg"
          :loading="creating"
          :disabled="!newName.trim()"
          :label="$t('common.create')"
          @click="createProject"
        />
      </div>
    </div>

    <USeparator />

    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        {{ $t("project.list.yourProjects") }}
      </h3>

      <div v-if="loading" class="space-y-2">
        <div
          v-for="n in 3"
          :key="n"
          class="h-14 rounded-xl bg-gray-800 animate-pulse"
        />
      </div>

      <div
        v-else-if="!projects.length"
        class="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border-2 border-dashed border-gray-800"
      >
        <UIcon name="i-lucide-folder" class="size-10 text-gray-700" />
        <p class="text-sm text-gray-500">{{ $t("project.list.noProjects") }}</p>
      </div>

      <TransitionGroup v-else name="list" tag="div" class="space-y-2">
        <div
          v-for="project in projects"
          :key="project.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <UIcon name="i-lucide-folder" class="size-4 text-gray-500 shrink-0" />

          <span class="flex-1 text-sm text-gray-200 truncate">
            {{ project.name }}
          </span>

          <div class="flex items-center gap-1 shrink-0">
            <UButton
              :to="`/projects/${project.id}`"
              icon="i-lucide-eye"
              size="sm"
              color="primary"
              variant="ghost"
              :title="$t('project.list.detailsTitle')"
            />
            <UButton
              icon="i-lucide-link"
              size="sm"
              color="neutral"
              variant="ghost"
              :title="$t('project.list.inviteMaster')"
              @click="openInviteModal(project)"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <USeparator />

    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        {{ $t("project.list.inboxTitle") }}
      </h3>
      <ProjectInboxRequests />
    </div>
  </div>

  <UModal v-model:open="showInviteModal">
    <template #content>
      <div class="p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-primary-500/10">
            <UIcon name="i-lucide-user-plus" class="size-5 text-primary-400" />
          </div>
          <h3 class="text-lg font-semibold text-white">
            {{
              $t("project.list.inviteTitle", { name: projectToInvite?.name })
            }}
          </h3>
        </div>

        <p class="text-sm text-gray-400">
          {{ $t("project.list.inviteBody") }}
        </p>

        <div
          class="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-gray-800"
        >
          <span class="flex-1 text-xs text-gray-500 truncate font-mono px-2">
            {{
              projectToInvite?.slug
                ? `${config.public.clientUrl}/join/${projectToInvite.slug}`
                : $t("common.generating")
            }}
          </span>
          <UButton
            icon="i-lucide-copy"
            size="sm"
            :label="$t('common.copy')"
            color="neutral"
            @click="copyInviteLink"
          />
        </div>

        <div class="flex justify-end pt-2">
          <UButton
            variant="soft"
            color="neutral"
            :label="$t('common.close')"
            @click="showInviteModal = false"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
