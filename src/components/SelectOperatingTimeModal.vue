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
        <ion-button color="medium" @click="selectTime">{{ "10:45 am" }}</ion-button>
      </ion-item>
      <ion-item lines="none">
        <ion-label>{{ translate("Closing Time") }}</ion-label>
        <ion-button color="medium" @click="selectTime">{{ "10:45 am" }}</ion-button>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal" :is-open="isTimeModalOpen" @didDismiss="() => isTimeModalOpen = false">
    <ion-content>
      <ion-datetime
        presentation="time"  
        show-default-buttons
        hour-cycle="h12"
      />
    </ion-content>
  </ion-modal>

  <ion-footer>
    <ion-toolbar>
      <ion-item lines="none">
        <ion-button color="danger">{{ translate("Reset") }}</ion-button>
      </ion-item>
      <ion-item slot="end" lines="none">
        <ion-button class="ion-margin-end" fill="outline">{{ translate("Cancel") }}</ion-button>
        <ion-button >{{ translate("Save") }}</ion-button>
      </ion-item>
    </ion-toolbar>
  </ion-footer>
</template>
  
<script lang="ts">
import { 
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFooter,
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
import { closeOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "SelectOperatingTimeModal",
  components: { 
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonFooter,
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