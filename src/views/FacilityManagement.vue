<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Facility Management") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-card button @click="router.push('/find-facilities')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="businessOutline"/>
            <h1>{{ translate("Facilities") }}</h1>
          </ion-item>
        </ion-card>

        <ion-card button @click="router.push('/find-parking')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="golfOutline"/>
            <h1>{{ translate("Parking") }}</h1>
          </ion-item>
        </ion-card>

        <ion-card class="ion-hide" button @click="router.push('/find-parking')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="golfOutline"/>
            <ion-card-title>{{ translate("Parking") }}</ion-card-title>
          </ion-item>
        </ion-card>

        <ion-card class="ion-hide" button @click="router.push('/find-groups')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="albumsOutline"/>
            <h1>{{ translate("Groups") }}</h1>
          </ion-item>
        </ion-card>

        <ion-card button @click="router.push('/settings')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="settingsOutline"/>
            <h1>{{ translate("Settings") }}</h1>
          </ion-item>
        </ion-card>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonCard,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  albumsOutline,
  businessOutline,
  golfOutline,
  settingsOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: 'FacilityManagement',
  components: {
    IonCard,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonPage,
    IonTitle,
    IonToolbar
  },
  setup() {
    const router = useRouter();

    return {
      albumsOutline,
      businessOutline,
      golfOutline,
      settingsOutline,
      translate,
      router
    };
  }
});
</script>

<style scoped>

ion-card {
  border-radius: 8px;
  transition: box-shadow 200ms ease;
}

ion-card:hover {
  box-shadow: 0px 8px 10px 0px rgba(0, 0, 0, 0.20), 0px 6px 30px 0px rgba(0, 0, 0, 0.12), 0px 16px 24px 0px rgba(0, 0, 0, 0.14);
}

main {
  display: grid;
  place-content: center;
  grid-template-columns: 1fr 1fr;
  height: calc(100vh - 56px);
  padding: var(--spacer-lg);
}

ion-card-header {
  display: flex;
  justify-content: start;
}

</style>