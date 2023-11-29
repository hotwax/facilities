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
      <ion-input v-model="selectedTimesForWeek.description" />
    </ion-item>
    <ion-item lines="full" class="ion-margin-top">
      <ion-label>{{ translate("Daily timings") }}</ion-label>
      <ion-toggle :isChecked="isDailyTimingsChecked" @click="updateDailyTimings" slot="end" />
    </ion-item>

    <ion-list lines="none" v-if="isDailyTimingsChecked">
      <ion-item v-for="(day, index) in days" :key="index">
        <ion-label>
          <p>{{ translate(day.charAt(0).toUpperCase() + day.slice(1)) }}</p>
        </ion-label>
        <ion-datetime-button :datetime="day+'StartTime'">
          <ion-label :slot="selectedTimesForWeek[day+'StartTime'] ? '' : 'time-target'">
            <p>{{ translate("Start Time") }}</p>
          </ion-label>
        </ion-datetime-button>
        -
        <ion-datetime-button :datetime="day+'EndTime'">
          <ion-label :slot="selectedTimesForWeek[day+'EndTime'] ? '' : 'time-target'">
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
          <ion-label :slot="selectedTimesForWeek.DailyStartTime ? '' : 'time-target'">
            <p >{{ translate("Start Time") }}</p>
          </ion-label>
        </ion-datetime-button>
        -
        <ion-datetime-button datetime="DailyEndTime">
          <ion-label :slot="selectedTimesForWeek.DailyEndTime ? '' : 'time-target'">
            <p >{{ translate("End Time") }}</p>
          </ion-label>
        </ion-datetime-button>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal" v-for="(day, index) in days"  :key="index" :keep-contents-mounted="true">
    <ion-datetime :id="day+'StartTime'" v-model="selectedTimesForWeek[day+'StartTime']" presentation="time" show-clear-button show-default-buttons hour-cycle="h12" />
  </ion-modal>

  <ion-modal class="date-time-modal" v-for="(day, index) in days" :key="index" :keep-contents-mounted="true">
    <ion-datetime :id="day+'EndTime'" v-model="selectedTimesForWeek[day+'EndTime']" presentation="time" show-clear-button show-default-buttons hour-cycle="h12" />
  </ion-modal>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button :disabled="!Object.keys(selectedTimesForWeek).length || !selectedTimesForWeek.description" @click="saveCustomSchedule">
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
      selectedTimesForWeek: {} as any,
    }
  },
  props: ['facilityId'],
  computed: {
    ...mapGetters({
      facilityCalendar: 'facility/getFacilityCalendar'
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
    async saveCustomSchedule() { 
      if(this.facilityCalendar?.calendarId) {
        try {
          const resp = await FacilityService.removeFacilityCalendar({
            facilityId: this.facilityId,
            calendarId: this.facilityCalendar.calendarId,
            facilityCalendarTypeId: this.facilityCalendar.facilityCalendarTypeId,
            fromDate: this.facilityCalendar.fromDate
          })

          if(!hasError(resp)) {
            await this.addCustomSchedule()
          } else {
            throw resp.data;
          }
        } catch(err) {
          logger.error(err)
        }
      } else {
        await this.addCustomSchedule()
      }
    },
    async addCustomSchedule() {
      let resp;
      let calendarId;
      let payload = {} as any
   
      if(this.days.length === 1) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const dailyStartTime = DateTime.fromISO(this.selectedTimesForWeek['DailyStartTime'], {setZone: true}).toFormat('HH:mm:ss')
        const dailyCapacity = this.getCapacity(this.selectedTimesForWeek['DailyStartTime'], this.selectedTimesForWeek['DailyEndTime'])
        if(dailyStartTime && dailyCapacity) {
          days.map((day: string) => {
            payload[day+'StartTime'] = dailyStartTime
            payload[day+'Capacity'] = dailyCapacity
          })
        }
      } else {
        this.days.map((day: string) => {
          const startTime = this.selectedTimesForWeek[day+'StartTime']
          const capacity = this.getCapacity(this.selectedTimesForWeek[day+'StartTime'], this.selectedTimesForWeek[day+'EndTime'])
          if(startTime && capacity) {
            payload[day+'StartTime'] = startTime
            payload[day+'Capacity'] = capacity
          }
        })
      }

      if(!Object.keys(payload).length) {
        showToast(translate("Please check all the selected start time and end time entries."))
        return;
      }

      try {
        resp = await FacilityService.createFacilityCalendar({ ...payload, description: this.selectedTimesForWeek.description})
        if(!hasError(resp)) {
          calendarId = resp.data.calendarId

          resp = await FacilityService.associateCalendarToFacility({
            facilityId: this.facilityId,
            calendarId: calendarId,
            fromDate: DateTime.now().toMillis(),
            facilityCalendarTypeId: 'OPERATING_HOURS'
          })

          if(!hasError(resp)) {
            showToast(translate("Successfully created and associated calendar to the facility."))
            await this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
            await this.store.dispatch('util/fetchCalendars', { facilityId: this.facilityId })
            modalController.dismiss()
          } else {
            throw resp.data
          }
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to create calendar to the facility."))
        logger.error(err)
      }
    },
    getCapacity(startTime: any, endTime: any) {
      const formatedStartTime = DateTime.fromISO(startTime, {setZone: true}).toMillis()
      const formatedEndTime = DateTime.fromISO(endTime, {setZone: true}).toMillis()

      if(formatedEndTime <= formatedStartTime) {
        return null;
      }

      return formatedEndTime - formatedStartTime
    }
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