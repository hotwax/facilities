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
import { initialise, resetConfig } from '@/adapter'
import { Settings } from 'luxon'
import { translate } from '@hotwax/dxp-components';
import { useUserStore } from '@/store/user';

const userStore = useUserStore();
const loader = ref(null as any);
const maxAge = import.meta.env.VITE_APP_CACHE_MAX_AGE ? parseInt(import.meta.env.VITE_APP_CACHE_MAX_AGE) : 0;

const userToken = computed(() => userStore.getUserToken);
const instanceUrl = computed(() => userStore.getInstanceUrl);
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

async function unauthorised() {
  // Mark the user as unauthorised, this will help in not making the logout api call in actions
  await userStore.logout({ isUserUnauthorised: true });
  const redirectUrl = window.location.origin + '/login';
  window.location.href = `${import.meta.env.VITE_APP_LOGIN_URL}?redirectUrl=${redirectUrl}`;
}

initialise({
  token: userToken.value,
  instanceUrl: instanceUrl.value,
  cacheMaxAge: maxAge,
  events: {
    unauthorised,
    responseError: () => {
      setTimeout(() => dismissLoader(), 100);
    },
    queueTask: (payload: any) => {
      emitter.emit("queueTask", payload);
    }
  }
})

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
  resetConfig()
});
</script>

