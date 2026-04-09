<script setup lang="ts">
import { profileSchema } from "@/schemas/profile";
import type { Database } from "@/types/database.types";
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

const profileStore = useProfileStore();
const user = useSupabaseUser();
const toast = useToast();
const { t } = useI18n();

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
        title: t("user.profile.loadError"),
        description: t("user.profile.loadErrorDesc"),
        color: "error",
      });
    }
  }
});

const bioLength = computed(() => profileStore.form.bio?.length ?? 0);

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
    title: t("user.profile.updatedTitle"),
    description: t("user.profile.updatedDesc", {
      name: profileStore.form.full_name,
    }),
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
    <div class="space-y-4">
      <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        {{ $t("user.profile.basicData") }}
      </h3>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField
          :label="$t('user.profile.displayName')"
          name="full_name"
          required
        >
          <UInput
            v-model="profileStore.form.full_name"
            :placeholder="$t('user.profile.displayNamePlaceholder')"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('user.profile.username')"
          name="username"
          :hint="$t('user.profile.usernameHint')"
        >
          <UInput
            v-model="profileStore.form.username"
            :placeholder="$t('user.profile.usernamePlaceholder')"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <span class="text-gray-500 text-sm">@</span>
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField
        :label="$t('user.profile.bio')"
        name="bio"
        :hint="`${bioLength}/300`"
      >
        <UTextarea
          v-model="profileStore.form.bio"
          :placeholder="$t('user.profile.bioPlaceholder')"
          :rows="3"
          size="lg"
          class="w-full"
        />
      </UFormField>
    </div>

    <USeparator />

    <div class="space-y-4">
      <div>
        <h3
          class="text-sm font-semibold text-gray-400 uppercase tracking-wider"
        >
          {{ $t("user.profile.contact") }}
        </h3>
        <p class="text-xs text-gray-600 mt-1">
          {{ $t("user.profile.contactHint") }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField :label="$t('user.profile.discord')" name="discord">
          <UInput
            v-model="profileStore.form.discord"
            :placeholder="$t('user.profile.discordPlaceholder')"
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

        <UFormField :label="$t('user.profile.whatsapp')" name="whatsapp">
          <UInput
            v-model="profileStore.form.whatsapp"
            :placeholder="$t('user.profile.whatsappPlaceholder')"
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

        <UFormField :label="$t('user.profile.twitter')" name="twitter">
          <UInput
            v-model="profileStore.form.twitter"
            :placeholder="$t('user.profile.twitterPlaceholder')"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-simple-icons-x" class="size-4 text-white" />
            </template>
          </UInput>
        </UFormField>

        <UFormField :label="$t('user.profile.instagram')" name="instagram">
          <UInput
            v-model="profileStore.form.instagram"
            :placeholder="$t('user.profile.instagramPlaceholder')"
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

        <UFormField
          :label="$t('user.profile.website')"
          name="website"
          class="sm:col-span-2"
        >
          <UInput
            v-model="profileStore.form.website"
            :placeholder="$t('user.profile.websitePlaceholder')"
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

    <div class="flex justify-end">
      <UButton
        type="submit"
        size="lg"
        :loading="profileStore.loading"
        icon="i-lucide-save"
        :label="$t('common.save')"
      />
    </div>
  </UForm>
</template>
