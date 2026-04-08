<!-- components/user/ProjectsList.vue -->
<script setup lang="ts">
// ─── Tipos ────────────────────────────────────────────────────────────────────
import type { Database } from "@/types/database.types";
type Project = Database["public"]["Tables"]["projects"]["Row"];

// ─── Setup ────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const config = useRuntimeConfig();

// ─── Estado ───────────────────────────────────────────────────────────────────
const projects = ref<Project[]>([]);
const loading = ref(false);
const newName = ref("");
const creating = ref(false);
const showInviteModal = ref(false);
const projectToInvite = ref<Project | null>(null);

// Función para abrir el modal de invitación
function openInviteModal(project: Project) {
  projectToInvite.value = project;
  showInviteModal.value = true;
}

// Función para copiar al portapapeles
async function copyInviteLink() {
  if (!projectToInvite.value?.slug) return;

  // Construimos la URL basada en el origin actual
  const url = `${config.public.clientUrl}/join/${projectToInvite.value.slug}`;

  try {
    await navigator.clipboard.writeText(url);
    toast.add({
      title: "Enlace copiado",
      description: "Ya puedes compartirlo con tus jugadores",
      color: "success",
    });
  } catch (err) {
    toast.add({ title: "Error al copiar", color: "error" });
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchProjects() {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("created_by", user.value!.sub)
      .order("created_at", { ascending: true });

    if (error) throw error;
    projects.value = data ?? [];
  } catch (err: any) {
    toast.add({
      title: "Error al cargar proyectos",
      description: err.message,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

await fetchProjects();

// ─── Crear ────────────────────────────────────────────────────────────────────
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
    toast.add({ title: "Proyecto creado", color: "success" });
  } catch (err: any) {
    toast.add({
      title: "Error al crear",
      description: err.message,
      color: "error",
    });
  } finally {
    creating.value = false;
  }
}

// Suscribirse a cambios en la tabla pivote para notificaciones en tiempo real
let inviteChannel: any = null;
onMounted(() => {
  // Suscribirse a inserciones en la tabla pivote
  inviteChannel = supabase
    .channel("nuevas-solicitudes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "profile_projects",
        // Opcional: Podrías filtrar por status 'pending'
        filter: `status=eq.pending`,
      },
      (payload) => {
        // payload.new tiene la info de la nueva relación
        const newRequest = payload.new;

        // Verificamos si el proyecto de la solicitud pertenece a la lista actual del usuario
        const project = projects.value.find(
          (p) => p.id === newRequest.project_id,
        );

        if (project) {
          toast.add({
            title: "Nueva solicitud",
            description: `Alguien quiere unirse a "${project.name}"`,
            color: "primary",
            actions: [
              {
                label: "Ver solicitudes",
                onClick: () => {
                  /* Aquí podrías abrir un modal de gestión */
                },
              },
            ],
          });

          // Opcional: Refrescar datos o marcar el proyecto con un punto rojo
          // fetchProjects();
        }
      },
    )
    .subscribe();
});

// Limpiar la suscripción al desmontar el componente
onUnmounted(() => {
  if (inviteChannel) {
    supabase.removeChannel(inviteChannel);
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- ── Crear nuevo proyecto ── -->
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Nuevo proyecto
      </h3>
      <div class="flex gap-2">
        <UInput
          v-model="newName"
          placeholder="Nombre del proyecto"
          size="lg"
          class="flex-1"
          @keydown.enter="createProject"
        />
        <UButton
          icon="i-lucide-plus"
          size="lg"
          :loading="creating"
          :disabled="!newName.trim()"
          label="Crear"
          @click="createProject"
        />
      </div>
    </div>

    <USeparator />

    <!-- ── Lista ── -->
    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Tus proyectos
      </h3>

      <!-- Loading -->
      <div v-if="loading" class="space-y-2">
        <div
          v-for="n in 3"
          :key="n"
          class="h-14 rounded-xl bg-gray-800 animate-pulse"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!projects.length"
        class="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border-2 border-dashed border-gray-800"
      >
        <UIcon name="i-lucide-folder" class="size-10 text-gray-700" />
        <p class="text-sm text-gray-500">No tienes proyectos todavía</p>
      </div>

      <!-- Items -->
      <TransitionGroup v-else name="list" tag="div" class="space-y-2">
        <div
          v-for="project in projects"
          :key="project.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <UIcon name="i-lucide-folder" class="size-4 text-gray-500 shrink-0" />

          <!-- Modo lectura -->
          <span class="flex-1 text-sm text-gray-200 truncate">
            {{ project.name }}
          </span>

          <!-- Acciones -->
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              :to="`/projects/${project.id}`"
              icon="i-lucide-eye"
              size="sm"
              color="primary"
              variant="ghost"
              title="Ver detalles"
            />
            <UButton
              icon="i-lucide-link"
              size="sm"
              color="neutral"
              variant="ghost"
              title="Invitar Master"
              @click="openInviteModal(project)"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <USeparator />

    <div class="space-y-2">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Solicitudes de unión
      </h3>
      <ProjectInboxRequests />
    </div>
  </div>

  <!-- ── Modal invitación ── -->
  <UModal v-model:open="showInviteModal">
    <template #content>
      <div class="p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-primary-500/10">
            <UIcon name="i-lucide-user-plus" class="size-5 text-primary-400" />
          </div>
          <h3 class="text-lg font-semibold text-white">
            Invitar a {{ projectToInvite?.name }}
          </h3>
        </div>

        <p class="text-sm text-gray-400">
          Cualquier Master con este enlace podrá solicitar unirse a tu proyecto.
        </p>

        <div
          class="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-gray-800"
        >
          <span class="flex-1 text-xs text-gray-500 truncate font-mono px-2">
            {{
              projectToInvite?.slug
                ? `${config.public.clientUrl}/join/${projectToInvite.slug}`
                : "Generando..."
            }}
          </span>
          <UButton
            icon="i-lucide-copy"
            size="sm"
            label="Copiar"
            color="neutral"
            @click="copyInviteLink"
          />
        </div>

        <div class="flex justify-end pt-2">
          <UButton
            variant="soft"
            color="neutral"
            label="Cerrar"
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
