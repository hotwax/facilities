<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select time") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  
  <ion-content>
    <ion-list>
      <ion-item>
        <ion-label>
          {{ "Start Time" }}
        </ion-label>
        <ion-button fill="outline">Change</ion-button>
      </ion-item>
    </ion-list>
  
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button>
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
import { 
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "SelectOperatingTimeModal",
  components: { 
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
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
    