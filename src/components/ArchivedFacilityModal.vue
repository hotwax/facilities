<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Archived parking") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list>
      <ion-item>
        <ion-label>
          Pickup rejected
          <p>PICKUP_REJECTED</p>
        </ion-label>
        <ion-icon slot="end" :icon="gitPullRequestOutline" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, gitPullRequestOutline, lockClosedOutline, lockOpenOutline } from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components'
import { showToast } from '@/utils';

export default defineComponent({
  name: "ArchivedFacilityModal",
  components: {
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonToolbar,
  },
  props: ['facility'],
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
  },
  setup() {
    return {
      closeOutline,
      gitPullRequestOutline,
      lockClosedOutline,
      lockOpenOutline,
      translate
    }
  },
});
</script> 