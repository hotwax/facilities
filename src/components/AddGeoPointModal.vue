<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Latitude & Longitude") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item class="ion-margin-bottom">
      <ion-label>{{ "<postal code value>" }}</ion-label>
      <ion-button fill="outline">
        {{ translate("Generate") }}
        <ion-icon slot="end" :icon="colorWandOutline" />
      </ion-button>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Latitude") }}</ion-label>
      <ion-input />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Longitude") }}</ion-label>
      <ion-input />
    </ion-item>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button>
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, colorWandOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
  
export default defineComponent({
  name: "AddGeoPointModal",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonTitle,
    IonToolbar,
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    }
  },
  setup() {
    return {
      closeOutline,
      colorWandOutline,
      saveOutline,
      translate
    };
  },
});
</script>