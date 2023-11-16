<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Custom mapping") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ translate("Facility details") }}
      </ion-list-header>
      <ion-item>
        <ion-label>{{ translate("Facility ID") }}</ion-label>
        <p>{{ "<facility-id>" }}</p>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Facility name") }}</ion-label>
        <p>{{ "<facility-name>" }}</p>
      </ion-item>
    </ion-list>

    <ion-list>
      <ion-list-header>
        {{ translate("Custom mapping") }}
      </ion-list-header>
      <ion-item>
        <ion-label>{{ translate("Mapping ID") }}</ion-label>
        <ion-input placeholder="Mapping ID" />
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Mapping Name") }}</ion-label>
        <ion-input placeholder="Mapping name" />
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Identification") }}</ion-label>
        <ion-input placeholder="Mapping Value" />
      </ion-item>
    </ion-list>
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
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "CustomMappingModal",
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
    IonList,
    IonListHeader,
    IonTitle,
    IonToolbar
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    }
  },
  setup() {
    return {
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>