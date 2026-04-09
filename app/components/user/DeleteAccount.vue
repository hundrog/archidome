<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();

const showModal = ref(false);
const deleting = ref(false);
const confirm = ref("");

const confirmWord = computed(() => t("user.deleteAccount.confirmWord"));
const canDelete = computed(() => confirm.value === confirmWord.value);

async function deleteAccount() {
  if (!canDelete.value) return;
  deleting.value = true;

  try {
    const { error } = await supabase.rpc("delete_user");
    if (error) throw error;

    await supabase.auth.signOut();

    toast.add({
      title: t("user.deleteAccount.deletedTitle"),
      description: t("user.deleteAccount.deletedDesc"),
      color: "success",
    });

    router.push("/");
  } catch (err: any) {
    toast.add({
      title: t("user.deleteAccount.deleteError"),
      description: err.message,
      color: "error",
    });
  } finally {
    deleting.value = false;
    showModal.value = false;
  }
}

function openModal() {
  confirm.value = "";
  showModal.value = true;
}
</script>

<template>
  <div class="rounded-xl border border-red-900/40 bg-red-950/20 p-5 space-y-3">
    <div>
      <h3 class="text-sm font-semibold text-red-400">
        {{ $t("user.deleteAccount.dangerZone") }}
      </h3>
      <p class="text-xs text-gray-500 mt-1">
        {{ $t("user.deleteAccount.dangerBody") }}
      </p>
    </div>
    <UButton
      color="error"
      variant="outline"
      icon="i-lucide-trash-2"
      :label="$t('user.deleteAccount.button')"
      size="sm"
      @click="openModal"
    />
  </div>

  <UModal v-model:open="showModal">
    <template #content>
      <div class="p-6 space-y-5">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-full bg-red-500/10 shrink-0">
            <UIcon name="i-lucide-triangle-alert" class="size-5 text-red-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">
              {{ $t("user.deleteAccount.modalTitle") }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ $t("user.deleteAccount.modalSubtitle") }}
            </p>
          </div>
        </div>

        <div
          class="rounded-lg bg-red-950/30 border border-red-900/40 p-4 space-y-2"
        >
          <p class="text-sm text-red-300 font-medium">
            {{ $t("user.deleteAccount.willDeleteTitle") }}
          </p>
          <ul class="text-xs text-gray-400 space-y-1">
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" />
              {{ $t("user.deleteAccount.itemProfile") }}
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" />
              {{ $t("user.deleteAccount.itemProjects") }}
            </li>
            <li class="flex items-center gap-2">
              <UIcon name="i-lucide-x" class="size-3 text-red-500" />
              {{ $t("user.deleteAccount.itemCampaigns") }}
            </li>
          </ul>
        </div>

        <div class="space-y-2">
          <p class="text-sm text-gray-400">
            {{
              $t("user.deleteAccount.typeConfirm", { word: confirmWord })
            }}
          </p>
          <UInput
            v-model="confirm"
            :placeholder="confirmWord"
            size="lg"
            class="w-full font-mono"
            autofocus
          />
        </div>

        <div class="flex justify-end gap-3 pt-1">
          <UButton
            variant="ghost"
            :label="$t('common.cancel')"
            @click="showModal = false"
          />
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :label="$t('user.deleteAccount.deletePermanent')"
            :loading="deleting"
            :disabled="!canDelete"
            @click="deleteAccount"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
