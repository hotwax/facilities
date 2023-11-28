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
      <ion-toggle :isChecked="isDailyTimingsChecked" @click="updateDailyTimings" slot="end"/>
    </ion-item>

    <ion-list lines="none" v-if="isDailyTimingsChecked">
      <ion-item v-for="(day, index) in days" :key="index">
        <ion-label>
          <p>{{ translate(day) }}</p>
        </ion-label>
        <ion-datetime-button :datetime="'start' + day" />-<ion-datetime-button :datetime="'end' + day" />
      </ion-item>
    </ion-list>

    <ion-list v-else>
      <ion-item lines="none">
        <ion-label>
          <p>{{ translate("Open and close time") }}</p>
        </ion-label>
        <ion-datetime-button datetime="startTime" /> - <ion-datetime-button datetime="endTime" />
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal"  :keep-contents-mounted="true">
    <ion-datetime :id="'start' + day" v-for="(day, index) in days" :key="index" presentation="time" show-default-buttons hour-cycle="h12" @ionChange="updateTime($event, day)" />
  </ion-modal>

  <ion-modal class="date-time-modal"  :keep-contents-mounted="true">
    <ion-datetime :id="'end' + day" v-for="(day, index) in days" :key="index" presentation="time" show-default-buttons hour-cycle="h12" @ionChange="updateTime($event, day)" />
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
      isDailyTimingsChecked: false as boolean,
      days: ['Time'],
      week: {} as any,
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    updateDailyTimings() {
      this.isDailyTimingsChecked = !this.isDailyTimingsChecked
      this.days = this.isDailyTimingsChecked ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] : ['Time']
    },
    updateTime(ev: CustomEvent, day: any) {
      if(this.week[day]) {
        this.week.day = ev.detail.value
      }
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