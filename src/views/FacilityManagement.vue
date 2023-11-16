<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Facility Management") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card button @click="router.push('/find-facilities')">
        <ion-card-header>
          <ion-icon :icon="businessOutline"/>
          <ion-card-title>{{ translate("Facilities") }}</ion-card-title>
        </ion-card-header>
      </ion-card>

      <ion-card button @click="router.push('/find-parking')">
        <ion-card-header>
          <ion-icon :icon="golfOutline"/>
          <ion-card-title>{{ translate("Parking") }}</ion-card-title>
        </ion-card-header>
      </ion-card>

      <ion-card button @click="router.push('/find-groups')">
        <ion-card-header>
          <ion-icon :icon="albumsOutline"/>
          <ion-card-title>{{ translate("Groups") }}</ion-card-title>
        </ion-card-header>
      </ion-card>

      <ion-card button @click="router.push('/settings')">
        <ion-card-header>
          <ion-icon :icon="settingsOutline"/>
          <ion-card-title>{{ translate("Settings") }}</ion-card-title>
        </ion-card-header>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
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
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
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
.list-item {
  --columns-desktop: 4;
}
</style>