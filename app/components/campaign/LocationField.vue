<script setup lang="ts">
const emit = defineEmits<{
  update: [
    payload: { lat: number | null; lng: number | null; locationName: string },
  ];
}>();

const props = defineProps<{
  initialLocation?: string | null;
  initialCoords?: { lat: number; lng: number } | null;
}>();

const toast = useToast();
const { t } = useI18n();
const { geocode, loading: geocoding, error: geocodeError } = useGeocoder();
const { fuzzCoords } = useFuzzCoords();
const { coords, request: requestGeo, loading: geoLoading } = useGeolocation();

const locationName = ref(props.initialLocation ?? "");
const resolvedCoords = ref<{ lat: number; lng: number } | null>(
  props.initialCoords ?? null,
);

function emitUpdate(lat: number | null, lng: number | null, name: string) {
  emit("update", { lat, lng, locationName: name });
}

function clearLocation() {
  resolvedCoords.value = null;
  emitUpdate(null, null, "");
}

async function onBlur() {
  if (!locationName.value.trim()) {
    clearLocation();
    return;
  }

  const result = await geocode(locationName.value);
  if (result) {
    const fuzzed = fuzzCoords(result.lat, result.lng);
    resolvedCoords.value = fuzzed;
    emitUpdate(fuzzed.lat, fuzzed.lng, locationName.value);
    toast.add({
      title: t("campaign.location.foundTitle"),
      description: result.displayName.split(",").slice(0, 3).join(","),
      color: "success",
    });
  } else {
    clearLocation();
    toast.add({
      title: t("campaign.location.notFoundTitle"),
      description: t("campaign.location.notFoundDesc"),
      color: "warning",
    });
  }
}

async function useMyLocation() {
  await requestGeo();

  if (!coords.value) {
    toast.add({ title: t("campaign.location.geoError"), color: "error" });
    return;
  }

  const fuzzed = fuzzCoords(coords.value.lat, coords.value.lng);
  resolvedCoords.value = fuzzed;

  const data = await $fetch<{ found: boolean; locationName: string | null }>(
    "/api/reverse-geocode",
    { query: { lat: fuzzed.lat, lng: fuzzed.lng } },
  );

  if (data.found && data.locationName) {
    locationName.value = data.locationName;
    emitUpdate(fuzzed.lat, fuzzed.lng, data.locationName);
    toast.add({
      title: t("campaign.location.savedTitle"),
      description: data.locationName,
      color: "success",
    });
  } else {
    emitUpdate(fuzzed.lat, fuzzed.lng, "");
    toast.add({
      title: t("campaign.location.resolveCityError"),
      color: "warning",
    });
  }
}

const locationHint = computed(() =>
  resolvedCoords.value
    ? t("campaign.form.locationHintVerified")
    : t("campaign.form.locationHintType"),
);
</script>

<template>
  <UFormField
    :label="$t('campaign.form.locationLabel')"
    name="location_name"
    :hint="locationHint"
  >
    <div class="flex gap-2">
      <UInput
        v-model="locationName"
        :placeholder="$t('campaign.form.locationPlaceholder')"
        size="lg"
        class="flex-1"
        :trailing-icon="resolvedCoords ? 'i-lucide-map-pin' : undefined"
        @blur="onBlur"
      />
      <UButton
        icon="i-lucide-locate-fixed"
        size="lg"
        color="neutral"
        variant="outline"
        :loading="geoLoading"
        :title="$t('campaign.form.useMyLocation')"
        @click="useMyLocation"
      />
    </div>
    <p v-if="geocodeError" class="text-xs text-red-400 mt-1">
      {{ geocodeError }}
    </p>
  </UFormField>
</template>
