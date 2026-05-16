<template>
  <ion-app>
    <ion-split-pane content-id="main-content" when="lg">
      <ion-router-outlet id="main-content" />
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet, IonSplitPane, loadingController, onIonViewWillEnter } from '@ionic/vue';
import { ref, onMounted, onUnmounted, computed } from 'vue';
import emitter from "@/event-bus";
import { Settings } from 'luxon'
import { translate } from "@common";
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const loader = ref(null as any);
const maxAge = import.meta.env.VITE_APP_CACHE_MAX_AGE ? parseInt(import.meta.env.VITE_APP_CACHE_MAX_AGE) : 0;

const userProfile = computed(() => userStore.getUserProfile);

async function presentLoader(options = { message: '', backdropDismiss: false }) {
  // When having a custom message remove already existing loader
  if (options.message && loader.value) dismissLoader();

  if (!loader.value) {
    loader.value = await loadingController
      .create({
        message: options.message ? translate(options.message) : (options.backdropDismiss ? translate("Click the backdrop to dismiss.") : translate("Loading...")),
        translucent: true,
        backdropDismiss: options.backdropDismiss || false
      });
  }
  await loader.value.present();
}

function dismissLoader() {
  if (loader.value) {
    loader.value.dismiss();
    loader.value = null;
  }
}

onMounted(async () => {
  emitter.on('presentLoader', presentLoader);
  emitter.on('dismissLoader', dismissLoader);

  // Handles case when user resumes or reloads the app
  // Luxon timezone should be set with the user's selected timezone
  if (userProfile.value && userProfile.value.userTimeZone) {
    Settings.defaultZone = userProfile.value.userTimeZone;
  }
});

onUnmounted(() => {
  emitter.off('presentLoader', presentLoader);
  emitter.off('dismissLoader', dismissLoader);
});
</script>

