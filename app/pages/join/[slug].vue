<script setup lang="ts">
// ─── Setup ────────────────────────────────────────────────────────────────────
const route = useRoute();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();
const slug = route.params.slug as string;

// ─── Estado ───────────────────────────────────────────────────────────────────
const project = ref<any>(null);
const loading = ref(true);
const sendingRequest = ref(false);
const alreadyMember = ref(false);

// ─── Fetch Datos del Proyecto ─────────────────────────────────────────────────
async function fetchProjectData() {
  loading.value = true;
  try {
    // Buscamos el proyecto por su slug
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

    // Verificar si el usuario ya envió solicitud o es parte
    if (user.value) {
      const { data: memberData } = await supabase
        .from("profile_projects")
        .select("status")
        .eq("project_id", data.id)
        .eq("profile_id", user.value.sub)
        .single();

      // console.log('Membership data:', profile_projects);

      if (memberData) alreadyMember.value = true;
    }
  } catch (err: any) {
    toast.add({ title: "Proyecto no encontrado", color: "error" });
    await navigateTo("/"); // Redirigir si no existe
  } finally {
    loading.value = false;
  }
}

fetchProjectData();

// ─── Enviar Solicitud ─────────────────────────────────────────────────────────
async function requestJoin() {
  if (!user.value) {
    return navigateTo("/login"); // Opcional: guardar URL para volver
  }

  console.log(user.value);

  sendingRequest.value = true;
  try {
    const { error } = await supabase.from("profile_projects").insert({
      project_id: project.value.id,
      profile_id: user.value.sub,
      status: "pending", // Por defecto, pero lo explicitamos
      owner: false,
    });

    if (error) throw error;

    alreadyMember.value = true;
    toast.add({
      title: "Solicitud enviada",
      description: "El owner del proyecto ha sido notificado.",
      color: "success",
    });
  } catch (err: any) {
    toast.add({
      title: "Error al enviar solicitud",
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
            Has sido invitado a unirte como Master a este proyecto.
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
              Creado por
            </p>
            <p class="text-sm text-gray-200">
              {{ project.profiles?.username || "Usuario anónimo" }}
            </p>
          </div>
        </div>

        <div class="pt-4">
          <UButton
            v-if="!alreadyMember"
            label="Solicitar unirse al proyecto"
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
            <span>Solicitud pendiente o ya eres parte del equipo</span>
          </div>
        </div>
      </div>
    </UCard>

    <div v-else class="space-y-4">
      <USkeleton class="h-64 w-full rounded-xl" />
    </div>
  </div>
</template>
