<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Custom schedule") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  
  <ion-content>
    <ion-item>
      <ion-label>{{ translate("Name") }}</ion-label>
      <ion-input />
    </ion-item>
    <ion-item lines="full" class="ion-margin-top">
      <ion-label>{{ translate("Daily timings") }}</ion-label>
      <ion-toggle :isChecked="isDailyTimingsChecked" @click="isDailyTimingsChecked = !isDailyTimingsChecked" slot="end"/>
    </ion-item>

    <ion-list lines="none" v-if="isDailyTimingsChecked">
      <ion-item >
        <ion-label>
          <p>{{ translate("Monday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Tuesday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Wednesday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Thursday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Friday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Saturday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
      <ion-item>
        <ion-label>
          <p>{{ translate("Sunday") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
    </ion-list>

    <ion-list v-else>
      <ion-item lines="none">
        <ion-label>
          <p>{{ translate("Open and close time") }}</p>
        </ion-label>
        <ion-datetime-button datetime="opentime" />-<ion-datetime-button datetime="endtime" />
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal" :keep-contents-mounted="true">
    <ion-datetime id="opentime" presentation="time" show-default-buttons hour-cycle="h12" />
  </ion-modal>

  <ion-modal class="date-time-modal" :keep-contents-mounted="true">
    <ion-datetime id="endtime" presentation="time" show-default-buttons hour-cycle="h12" />
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
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "CustomScheduleModal",
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
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  data() {
    return {
      isDailyTimingsChecked: false as boolean
    }
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

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
ion-modal.date-time-modal {
  --width: 290px;
  --height: 440px;
  --border-radius: 8px;
}
</style>