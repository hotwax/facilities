<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Location") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-label>{{ translate("Type") }}</ion-label>
      <ion-select interface="popover" :placeholder="translate('Select')" value="bulk" required>
        <ion-select-option>{{ "pick/primary" }}</ion-select-option>
        <ion-select-option>{{ "bulk" }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Area") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="area"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Aisle") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="aisle" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Section") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="section"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Level") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="level"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Sequence") }}</ion-label>
      <ion-input placeholder="sequence"/>
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "AddLocationModal",
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
    IonSelect,
    IonSelectOption,
    IonText,
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