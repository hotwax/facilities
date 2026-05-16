<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Settings") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="user-profile">
        <ion-card>
          <ion-item lines="full">
            <ion-avatar slot="start" v-if="userProfile?.partyImageUrl">
              <Image :src="userProfile.partyImageUrl"/>
            </ion-avatar>
            <!-- ion-no-padding to remove extra side/horizontal padding as additional padding 
            is added on sides from ion-item and ion-padding-vertical to compensate the removed
            vertical padding -->
            <ion-card-header class="ion-no-padding ion-padding-vertical">
              <ion-card-subtitle>{{ userProfile.username }}</ion-card-subtitle>
              <ion-card-title>{{ userProfile?.userFullName }}</ion-card-title>
            </ion-card-header>
          </ion-item>
          <ion-button color="danger" @click="logout()">{{ translate("Logout") }}</ion-button>
          <ion-button :standalone-hidden="!userStore.hasPermission('COMMON_ADMIN')" fill="outline" @click="goToLaunchpad()">
            {{ translate("Go to Launchpad") }}
            <ion-icon slot="end" :icon="openOutline" />
          </ion-button>
          <!-- Commenting this code as we currently do not have reset password functionality -->
          <!-- <ion-button fill="outline" color="medium">{{ translate("Reset password") }}</ion-button> -->
        </ion-card>
      </div>

      <div class="section-header">
        <h1>{{ translate('OMS') }}</h1>
      </div>

      <section>
        <OmsInstanceNavigator />
      </section>

      <hr />

      <AppVersionInfo />

      <section>
        <TimeZoneSwitcher @timeZoneUpdated="timeZoneUpdated" />
        <LanguageSwitcher />
      </section>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { 
  IonAvatar,
  IonButton, 
  IonCard, 
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { 
  codeWorkingOutline, 
  ellipsisVerticalOutline, 
  globeOutline, 
  openOutline, 
  timeOutline 
} from 'ionicons/icons'
import { computed, onMounted, ref } from 'vue';
import { translate } from '@common';
import { DateTime } from 'luxon';
import Image from '@/components/Image.vue';
import { useUserStore } from '@/store/user';
import OmsInstanceNavigator from '@/components/OmsInstanceNavigator.vue';
import TimeZoneSwitcher from '@/components/TimeZoneSwitcher.vue';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import AppVersionInfo from '@/components/AppVersionInfo.vue';
const userStore = useUserStore();

const baseURL = import.meta.env.VITE_APP_BASE_URL;
const appInfo = ref((import.meta.env.VITE_APP_VERSION_INFO ? JSON.parse(import.meta.env.VITE_APP_VERSION_INFO) : {}) as any);
const appVersion = ref("");
const locales = ref(import.meta.env.VITE_APP_LOCALES ? JSON.parse(import.meta.env.VITE_APP_LOCALES) : {"en-US": "English"});

const userProfile = computed(() => userStore.getUserProfile);
const locale = computed(() => userStore.getLocale);

onMounted(() => {
  appVersion.value = appInfo.value.branch ? (appInfo.value.branch + "-" + appInfo.value.revision) : appInfo.value.tag;
});

async function logout() {
  userStore.logout({ isUserUnauthorised: false }).then((redirectionUrl: string) => {
    // if not having redirection url then redirect the user to launchpad
    if(!redirectionUrl) {
      const redirectUrl = window.location.origin + '/login'
      window.location.href = `${import.meta.env.VITE_APP_LOGIN_URL}?isLoggedOut=true&redirectUrl=${redirectUrl}`
    }
  })
}

function goToLaunchpad() {
  window.location.href = `${import.meta.env.VITE_APP_LOGIN_URL}`
}

async function timeZoneUpdated(tzId: string) {
  await userStore.setUserTimeZone(tzId);
}

function getDateTime(time: any) {
  return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
}

function setLocale(locale: string) {
  userStore.setLocale(locale);
}
</script>

<style scoped>
ion-card > ion-button {
  margin: var(--spacer-xs);
}
section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start;
}
.user-profile {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}
hr {
  border-top: 1px solid var(--ion-color-medium);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacer-xs) 10px 0px;
}
</style>