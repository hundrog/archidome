<script setup lang="ts">
import type { Database } from "@/types/database.types";
type ProfileProject = Database["public"]["Tables"]["profile_projects"]["Row"] & {
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  projects: {
    name: string;
    created_by: string;
  };
};

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const toast = useToast();

const requests = ref<ProfileProject[]>([]);
const loading = ref(true);

// --- Cargar Solicitudes ---
async function fetchRequests() {
  loading.value = true;
  // Nota: Filtramos las solicitudes de proyectos donde YO soy el creador
  const { data, error } = await supabase
    .from('profile_projects')
    .select(`
      status, project_id, profile_id,
      projects!inner(name, created_by),
      profiles(username, avatar_url)
    `)
    .eq('projects.created_by', user.value!.id)
    .eq('status', 'pending');

  if (!error) requests.value = data as ProfileProject[];
  else toast.add({ title: 'Error al cargar solicitudes', description: error.message, color: 'error' });
  loading.value = false;
}

// --- Aceptar/Rechazar ---
async function handleAction(request: ProfileProject, newStatus: 'accepted' | 'rejected') {
  try {
    const { error } = await supabase
      .from('profile_projects')
      .update({ status: newStatus })
      .match({ 
        project_id: request.project_id, 
        profile_id: request.profile_id 
      });

    if (error) throw error;

    // Optimistic update: remove from list
    requests.value = requests.value.filter(r => 
      !(r.project_id === request.project_id && r.profile_id === request.profile_id)
    );

    toast.add({ 
      title: newStatus === 'accepted' ? 'Master aceptado' : 'Solicitud rechazada',
      color: newStatus === 'accepted' ? 'success' : 'neutral'
    });
  } catch (err: any) {
    toast.add({ title: 'Error al procesar', description: err.message, color: 'error' });
  }
}

onMounted(fetchRequests);
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="p-8 text-center"><USpin icon="i-lucide-loader-2" /></div>
    
    <div v-else-if="!requests.length" class="p-8 text-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
      No tienes solicitudes pendientes por ahora.
    </div>

    <TransitionGroup v-else name="list" tag="div" class="space-y-3">
      <div v-for="req in requests" :key="req.profile_id + req.project_id" 
           class="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
        
        <div class="flex items-center gap-3">
          <UAvatar :src="req.profiles.avatar_url || ''" :alt="req.profiles.username" />
          <div>
            <p class="text-sm font-medium text-white">
              <span class="text-primary-400">@{{ req.profiles.username }}</span> 
              quiere unirse a
            </p>
            <p class="text-xs text-gray-500 font-mono">{{ req.projects.name }}</p>
          </div>
        </div>

        <div class="flex gap-2">
          <UButton 
            icon="i-lucide-check" 
            color="success" 
            variant="soft" 
            size="sm"
            @click="handleAction(req, 'accepted')"
          />
          <UButton 
            icon="i-lucide-x" 
            color="error" 
            variant="soft" 
            size="sm"
            @click="handleAction(req, 'rejected')"
          />
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>