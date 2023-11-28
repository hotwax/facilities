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
      <ion-input v-model="week.description" />
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
        <ion-datetime-button :datetime="day+'StartTime'">
          <ion-note :slot="week[day+'StartTime'] ? '' : 'time-target'">{{ "Start Time" }}</ion-note>
        </ion-datetime-button>
        -
        <ion-datetime-button :datetime="day+'EndTime'">
          <ion-note :slot="week[day+'EndTime'] ? '' : 'time-target'">{{ "End Time" }}</ion-note>
        </ion-datetime-button>
      </ion-item>
    </ion-list>

    <ion-list v-else>
      <ion-item lines="none">
        <ion-label>
          <p>{{ translate("Open and close time") }}</p>
        </ion-label>
        <ion-datetime-button datetime="DailyStartTime">
          <ion-note :slot="week.DailyStartTime ? '' : 'time-target'">{{ "Start Time" }}</ion-note>
        </ion-datetime-button>
        -
        <ion-datetime-button datetime="DailyEndTime">
          <ion-note :slot="week.DailyEndTime ? '' : 'time-target'">{{ "End Time" }}</ion-note>
        </ion-datetime-button>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal" v-for="(day, index) in days"  :key="index" :keep-contents-mounted="true">
    <ion-datetime :id="day+'StartTime'" v-model="week[day+'StartTime']" presentation="time" show-default-buttons hour-cycle="h12" @ionChange="updateTime($event, day+'StartTime')" />
  </ion-modal>

  <ion-modal class="date-time-modal" v-for="(day, index) in days" :key="index" :keep-contents-mounted="true">
    <ion-datetime :id="day+'EndTime'" v-model="week[day+'EndTime']" presentation="time" show-default-buttons hour-cycle="h12" @ionChange="updateTime($event, day+'EndTime')" />
  </ion-modal>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveCustomSchedule">
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
import { FacilityService } from "@/services/FacilityService";
import logger from "@/logger";
import { hasError } from "@hotwax/oms-api";
import { DateTime } from "luxon";
import { mapGetters } from "vuex";

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
      days: ['Daily'],
      week: {} as any,
    }
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    updateDailyTimings() {
      this.isDailyTimingsChecked = !this.isDailyTimingsChecked
      this.days = this.isDailyTimingsChecked ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] : ['Daily']
    },
    updateTime(ev: CustomEvent, day: any) {
      if(this.week[day]) {
        this.week.day = ev.detail.value
      }
    },
    async saveCustomSchedule() {
      let resp;
      let payload = {
        description: this.week.description
      } as any
      
      this.days.map((day: string) => {
        if(this.week[day+'StartTime']) {
          payload[day+'StartTime'] = DateTime.fromISO(this.week[day+'StartTime'], {setZone: true}).toFormat('HH:mm:ss')
          payload[day+'Capacity'] = this.getCapacity(this.week[day+'StartTime'], this.week[day+'EndTime'])
        }
      })

      try {
        resp = await FacilityService.createFacilityCalendar(payload)

        if(!hasError(resp)) {
          console.log(resp);
          
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    getCapacity(startTime: string, endTime: any) {
      return DateTime.fromISO(endTime, {setZone: true}).toMillis() - DateTime.fromISO(startTime, {setZone: true}).toMillis()
    },
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