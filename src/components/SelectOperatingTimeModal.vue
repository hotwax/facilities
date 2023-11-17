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
      <ion-item lines="none">
        <ion-label>{{ translate("Opening Time") }}</ion-label>
        <ion-datetime-button datetime="opentime" />
      </ion-item>
      <ion-item lines="none">
        <ion-label>{{ translate("Closing Time") }}</ion-label>
        <ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item lines="none">
        <ion-button color="danger">{{ translate("Reset") }}</ion-button>
      </ion-item>
    </ion-list>
  </ion-content>


  <ion-modal :keep-contents-mounted="true">
    <ion-datetime id="opentime" presentation="time" show-default-buttons hour-cycle="h23" />
  </ion-modal>

  <ion-modal :keep-contents-mounted="true">
    <ion-datetime id="endtime" presentation="time" show-default-buttons hour-cycle="h23" />
  </ion-modal>

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
  IonDatetime,
  IonDatetimeButton,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
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
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      isTimeModalOpen: false
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    selectTime() {
      this.isTimeModalOpen = true
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

<style scoped>
ion-modal.date-time-modal {
  --width: 290px;
  --height: 440px;
  --border-radius: 8px;
}
</style>