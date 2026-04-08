<script setup lang="ts">
// components/user/ProfileForm.vue
// ─── Schema ───────────────────────────────────────────────────────────────────
import { profileSchema } from "@/schemas/profile";
import type { Database } from "@/types/database.types";
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

// ─── Setup ────────────────────────────────────────────────────────────────────
const profileStore = useProfileStore();
const user = useSupabaseUser();
const toast = useToast();

// ─── Cargar perfil ────────────────────────────────────────────────────────────
onMounted(async () => {
  if (user.value) {
    try {
      await profileStore.fetchProfileById(user.value.sub);
      if (profileStore.currentProfile) {
        const profile = profileStore.currentProfile;
        profileStore.form = {
          full_name: profile.full_name ?? "",
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          discord: profile.discord ?? "",
          whatsapp: profile.whatsapp ?? "",
          twitter: profile.twitter ?? "",
          instagram: profile.instagram ?? "",
          website: profile.website ?? "",
        };
      }
    } catch (error) {
      toast.add({
        title: "Error al cargar perfil",
        description: "No se pudo cargar tu perfil. Intenta recargar la página.",
        color: "error",
      });
    }
  }
});

// ─── Estado ───────────────────────────────────────────────────────────────────

const bioLength = computed(() => profileStore.form.bio?.length ?? 0);

// ─── Submit ───────────────────────────────────────────────────────────────────
async function onSubmit() {
  const payload: ProfileInsert = {
    full_name: profileStore.form.full_name,
    username: profileStore.form.username,
    bio: profileStore.form.bio,
    discord: profileStore.form.discord,
    whatsapp: profileStore.form.whatsapp,
    twitter: profileStore.form.twitter,
    instagram: profileStore.form.instagram,
    website: profileStore.form.website,
    id: user.value!.sub,
  };
  profileStore.updateProfile(payload);

  toast.add({
    title: "¡Perfil actualizado!",
    description: `"${profileStore.form.full_name}" fue guardado.`,
    color: "success",
  });
}
</script>

<template>
  <UForm
    :schema="profileSchema"
    :state="profileStore.form"
    class="space-y-8"
    @submit="onSubmit"
  >
    <!-- ── Datos básicos ── -->
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Datos básicos
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Display Name" name="full_name" required>
          <UInput
            v-model="profileStore.form.full_name"
            placeholder="The name that will be shown to other players"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="User name"
          name="username"
          hint="Solo letras, números y _"
        >
          <UInput
            v-model="profileStore.form.username"
            placeholder="tu_username"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <span class="text-gray-500 text-sm">@</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField label="Bio" name="bio" :hint="`${bioLength}/300`">
        <UTextarea
          v-model="profileStore.form.bio"
          placeholder="Cuéntanos un poco de ti..."
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <USeparator />

    <!-- ── Contacto ── -->
    <div class="space-y-4">
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          Contacto
        </h3>
        <p class="text-xs text-gray-600 mt-1">
          Solo llena los que quieras mostrar a otros jugadores
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Discord" name="discord">
          <UInput
            v-model="profileStore.form.discord"
            placeholder="usuario#0000 o usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon
                name="i-simple-icons-discord"
                class="size-4 text-indigo-400"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="WhatsApp" name="whatsapp">
          <UInput
            v-model="profileStore.form.whatsapp"
            placeholder="+52 33 1234 5678"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon
                name="i-simple-icons-whatsapp"
                class="size-4 text-green-400"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Twitter / X" name="twitter">
          <UInput
            v-model="profileStore.form.twitter"
            placeholder="tu_usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-simple-icons-x" class="size-4 text-white" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Instagram" name="instagram">
          <UInput
            v-model="profileStore.form.instagram"
            placeholder="tu_usuario"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon
                name="i-simple-icons-instagram"
                class="size-4 text-pink-400"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Sitio web" name="website" class="sm:col-span-2">
          <UInput
            v-model="profileStore.form.website"
            placeholder="https://tuwebsite.com"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-lucide-globe" class="size-4 text-gray-400" />
            </template>
          </UInput>
        </UFormField>
      </div>
    </div>

    <!-- ── Guardar ── -->
    <div class="flex justify-end">
      <UButton
        type="submit"
        size="lg"
        :loading="profileStore.loading"
        icon="i-lucide-save"
        label="Guardar cambios"
      />
    </div>
  </UForm>
</template>
