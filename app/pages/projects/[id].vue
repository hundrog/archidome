<script setup lang="ts">
type Database = import("@/types/database.types").Database;
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileProjectRow =Database["public"]["Tables"]["profile_projects"]["Row"];

type ProjectFull = ProjectRow & {
  campaigns: (CampaignRow & {
    profiles?: Pick<ProfileRow, "username" | "avatar_url">;
  })[];
  profile_projects: (ProfileProjectRow & {
    profiles: Pick<ProfileRow, "id" | "username" | "avatar_url">;
  })[];
};

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"] & {
  profiles?: Pick<ProfileRow, "full_name" | "username" | "avatar_url">;
};


const projectId = useRoute().params.id as string;
const project = ref<ProjectFull | null>(null);
const toast = useToast();
const supabase = useSupabaseClient();
const deletingId = ref<string | null>(null);
const showDeleteModal = ref(false);
const projectToDelete = ref<ProjectRow | null>(null);
const editingId = ref<string | null>(null);
const editingName = ref("");

const fetchProjectDetails = async (projectId: string) => {
  const { data, error } = await supabase
    .from("projects")
    .select(`
    *,
    campaigns (
      *,
      profiles:user_id (
        username,
        avatar_url
      )
    ),
    profile_projects (
      status,
      owner,
      profiles ( id, username, avatar_url )
    )
  `)
    .eq("id", projectId)
    .single();

  if (error) throw error;

  project.value = data as unknown as ProjectFull;
};

onMounted(async () => {
  try {
    await fetchProjectDetails(projectId);
  } catch (error) {
    console.error("Error fetching project details:", error);
    toast.add({
      title: "Error al cargar detalles del proyecto",
      color: "error",
    });
  }
});

// ─── Editar inline ────────────────────────────────────────────────────────────
function startEdit(project: ProjectRow) {
  editingId.value = project.id;
  editingName.value = project.name;
}

function cancelEdit() {
  editingId.value = null;
  editingName.value = "";
}

async function saveEdit(project: ProjectRow) {
  if (!editingName.value.trim() || editingName.value === project.name) {
    cancelEdit();
    return;
  }

  try {
    const { error } = await supabase
      .from("projects")
      .update({ name: editingName.value.trim() })
      .eq("id", project.id);

    if (error) throw error;

    project.name = editingName.value.trim();
    cancelEdit();
    toast.add({ title: "Proyecto actualizado", color: "success" });
  } catch (err: any) {
    toast.add({
      title: "Error al actualizar",
      description: err.message,
      color: "error",
    });
  }
}

function onEditKeydown(event: KeyboardEvent, project: ProjectRow) {
  if (event.key === "Enter") saveEdit(project);
  if (event.key === "Escape") cancelEdit();
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
function confirmDelete(project: ProjectRow) {
  projectToDelete.value = project;
  showDeleteModal.value = true;
}

async function deleteProject() {
  if (!projectToDelete.value) return;
  deletingId.value = projectToDelete.value.id;

  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.value.id);

    if (error) throw error;

    showDeleteModal.value = false;
    projectToDelete.value = null;

    navigateTo("/campaigns");
    toast.add({ title: "Proyecto eliminado", color: "success" });
  } catch (err: any) {
    toast.add({
      title: "Error al eliminar",
      description: err.message,
      color: "error",
    });
  } finally {
    deletingId.value = null;
  }
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
useSeoMeta({
  title: () => project.value ? project.value.name : "Proyecto no encontrado",
  description: () => "Detalles del proyecto " + (project.value ? project.value.name : ""),
});
</script>
<template>
  <div class="min-h-screen bg-surface">
    <div class="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <!-- ── Encabezado ── -->
      <div>
        <NuxtLink
          to="/projects"
          class="inline-flex items-center gap-2 font-body text-label-xl text-on-surface-dim hover:text-on-surface transition-colors mb-6"
        >
          <UIcon name="i-lucide-arrow-left" class="size-4" />
          Volver a projectos
        </NuxtLink>
        <!-- Modo edición -->
        <UInput
          v-if="editingId === project?.id"
          v-model="editingName"
          size="xl"
          class="flex py-2"
          autofocus
          @keydown="onEditKeydown($event, project)"
        />
        <h1 v-else class="font-display text-display-sm text-on-surface">
          {{ project?.name || "Proyecto sin nombre" }}
        </h1>
        <template v-if="editingId === project?.id">
          <UButton
            icon="i-lucide-check"
            size="xs"
            color="success"
            variant="ghost"
            title="Guardar"
            @click="saveEdit(project as ProjectRow)"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Cancelar"
            @click="cancelEdit"
          />
        </template>
        <template v-else>
          <UButton
            icon="i-lucide-pencil"
            size="xs"
            color="neutral"
            variant="ghost"
            title="Editar"
            @click="startEdit(project as ProjectRow)"
          />
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            title="Eliminar"
            @click="confirmDelete(project as ProjectRow)"
          />
        </template>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <UIcon name="i-lucide-swords" /> Campañas
            </h3>
            <UButton
              icon="i-lucide-plus"
              size="xs"
              label="Nueva Campaña"
              to="/campaigns/new"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div
              v-if="!project?.campaigns.length"
              class="p-8 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl"
            >
              No tienes campañas por ahora.
            </div>

            <CampaignCard
              v-for="campaign in project?.campaigns"
              :key="campaign.id"
              :campaign="campaign as Campaign"
            />

          </div>
        </div>

        <div class="space-y-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <UIcon name="i-lucide-users" /> Staff de Masters
          </h3>

          <div
          v-if="project"
            class=""
          >
            <ProjectStaffAdmin :project="project" @refresh="fetchProjectDetails(project.id)" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Modal eliminar ── -->
  <UModal v-model:open="showDeleteModal">
    <template #content>
      <div class="p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-red-500/10">
            <UIcon name="i-lucide-triangle-alert" class="size-5 text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-white">Eliminar proyecto</h3>
        </div>

        <p class="text-sm text-gray-400">
          ¿Eliminar
          <span class="text-white font-medium">{{ projectToDelete?.name }}</span
          >? Las campañas asociadas también serán eliminadas.
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <UButton
            variant="ghost"
            label="Cancelar"
            @click="showDeleteModal = false"
          />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            label="Eliminar"
            :loading="!!deletingId"
            @click="deleteProject"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
