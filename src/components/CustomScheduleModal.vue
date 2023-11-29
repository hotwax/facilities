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
          <p>{{ translate(day.charAt(0).toUpperCase() + day.slice(1)) }}</p>
        </ion-label>
        <ion-datetime-button :datetime="day+'StartTime'">
          <ion-label :slot="week[day+'StartTime'] ? '' : 'time-target'">
            <p>{{ translate("Start Time") }}</p>
          </ion-label>
        </ion-datetime-button>
        -
        <ion-datetime-button :datetime="day+'EndTime'">
          <ion-label :slot="week[day+'EndTime'] ? '' : 'time-target'">
            <p>{{ translate("End Time") }}</p>
          </ion-label>
        </ion-datetime-button>
      </ion-item>
    </ion-list>

    <ion-list v-else>
      <ion-item lines="none">
        <ion-label>
          <p>{{ translate("Open and close time") }}</p>
        </ion-label>
        <ion-datetime-button datetime="DailyStartTime">
          <ion-label :slot="week.DailyStartTime ? '' : 'time-target'"  >
            <p >{{ translate("Start Time") }}</p>
          </ion-label>
        </ion-datetime-button>
        -
        <ion-datetime-button datetime="DailyEndTime">
          <ion-label :slot="week.DailyEndTime ? '' : 'time-target'"  >
            <p >{{ translate("End Time") }}</p>
          </ion-label>
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
import { mapGetters, useStore } from "vuex";
import { showToast } from "@/utils";

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
  props: ['facilityId'],
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
      let calendarId;
      let payload = {} as any      
      
      if(this.days.length === 1) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const dailyStartTime = DateTime.fromISO(this.week['DailyStartTime'], {setZone: true}).toFormat('HH:mm:ss')
        const dailyCapacity = this.getCapacity(this.week['DailyStartTime'], this.week['DailyEndTime'])
        if(dailyStartTime && dailyCapacity) {
          days.map((day: string) => {
            payload[day+'StartTime'] = dailyStartTime
            payload[day+'Capacity'] = dailyCapacity
          })
        }
      } else {
        this.days.map((day: string) => {
          if(this.week[day+'StartTime'] && this.week[day+'EndTime']) {
            payload[day+'StartTime'] = DateTime.fromISO(this.week[day+'StartTime'], {setZone: true}).toFormat('HH:mm:ss')
            payload[day+'Capacity'] = this.getCapacity(this.week[day+'StartTime'], this.week[day+'EndTime'])
          }
        })
      }

      try {
        resp = await FacilityService.createFacilityCalendar({ ...payload, description: this.week.description})
        if(!hasError(resp)) {
          calendarId = resp.data.calendarId
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
        
      try {
        resp = await FacilityService.associateCalendarToFacility({
          facilityId: this.facilityId,
          calendarId: 10031,
          fromDate: DateTime.now().toMillis(),
          facilityCalendarTypeId: 'OPERATING_HOURS'
        })

        if(!hasError(resp)) {
          showToast(translate("Successfully created and associated calendar to the facility."))
          await this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
          await this.store.dispatch('util/fetchUtilCalendars', { facilityId: this.facilityId })
          modalController.dismiss()
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to create or associate calendar to the facility."))
        logger.error(err)
      }
    },
    getCapacity(startTime: any, endTime: any) {
      endTime = DateTime.fromISO(endTime, {setZone: true}).toMillis()
      startTime = DateTime.fromISO(startTime, {setZone: true}).toMillis()

      if(endTime <= startTime) {
        return null;
      }

      return endTime - startTime
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      saveOutline,
      store,
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