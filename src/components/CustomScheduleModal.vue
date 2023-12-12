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
      <ion-label>
        {{ translate("Name") }} <ion-text color="danger">*</ion-text>
      </ion-label>
      <ion-input v-model="selectedTimesForWeek.description" />
    </ion-item>
    <ion-item lines="full" class="ion-margin-top">
      <ion-label>{{ translate("Daily timings") }}</ion-label>
      <ion-toggle :checked="isDailyTimingsChecked" @ionChange="updateDailyTimings" slot="end" />
    </ion-item>

    <ion-list lines="none" v-if="isDailyTimingsChecked">
      <ion-item v-for="(day, index) in days" :key="index">
        <ion-label>
          <p>{{ translate(day.charAt(0).toUpperCase() + day.slice(1)) }}</p>
        </ion-label>
        <ion-chip @click="openTimeModal(day+'StartTime')">
          {{ selectedTimesForWeek[day+'StartTime'] ? getTime(selectedTimesForWeek[day+'StartTime']) : 'Start Time' }}
          <ion-icon v-if="selectedTimesForWeek[day+'StartTime']" :icon="closeCircle" @click="clearSelectedTime(day+'StartTime')" @click.stop />
        </ion-chip>
        -
        <ion-chip @click="openTimeModal(day+'EndTime')">
          {{ selectedTimesForWeek[day+'EndTime'] ? getTime(selectedTimesForWeek[day+'EndTime']) : 'End Time' }}
          <ion-icon v-if="selectedTimesForWeek[day+'EndTime']" :icon="closeCircle" @click="clearSelectedTime(day+'EndTime')" @click.stop />
        </ion-chip>
      </ion-item>
    </ion-list>

    <ion-list v-else>
      <ion-item lines="none">
        <ion-label>
          <p>{{ translate("Open and close time") }}</p>
        </ion-label>
        <ion-chip @click="openTimeModal('DailyStartTime')">
          {{ selectedTimesForWeek['DailyStartTime'] ? getTime(selectedTimesForWeek['DailyStartTime']) : 'Start Time' }}
          <ion-icon v-if="selectedTimesForWeek['DailyStartTime']" :icon="closeCircle" @click="clearSelectedTime('DailyStartTime')" @click.stop />
        </ion-chip>
        -
        <ion-chip @click="openTimeModal('DailyEndTime')">
          {{ selectedTimesForWeek['DailyEndTime'] ? getTime(selectedTimesForWeek['DailyEndTime']) : 'End Time' }}
          <ion-icon v-if="selectedTimesForWeek['DailyEndTime']" :icon="closeCircle" @click="clearSelectedTime('DailyEndTime')" @click.stop />
        </ion-chip>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-modal class="date-time-modal" :is-open="isTimeModalOpen" @didDismiss="() => isTimeModalOpen = false">
    <ion-datetime
      show-default-buttons
      hour-cycle="h12"
      presentation="time"
      :value="selectedTimesForWeek[selectedDayTime] ? selectedTimesForWeek[selectedDayTime] : ''"
      @ionChange="updateTime($event)"
    />
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
  IonChip,
  IonContent,
  IonDatetime,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeCircle, closeOutline, saveOutline } from "ionicons/icons";
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
    IonChip,
    IonContent,
    IonDatetime,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  data() {
    return {
      isDailyTimingsChecked: false as boolean,
      days: ['Daily'],
      selectedTimesForWeek: {} as any,
      selectedDayTime: '',
      isTimeModalOpen: false
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
    clearSelectedTime(selectedDayTime: string) {
      this.selectedTimesForWeek[selectedDayTime] = ''
    },
    async openTimeModal(selectedDayTime: string) {
      this.selectedDayTime = selectedDayTime
      this.isTimeModalOpen = true
    },
    updateTime(event: CustomEvent) {
      this.selectedTimesForWeek[this.selectedDayTime] = event.detail.value
    },
    updateDailyTimings() {
      this.isDailyTimingsChecked = !this.isDailyTimingsChecked
      this.days = this.isDailyTimingsChecked ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] : ['Daily']
    },
    async saveCustomSchedule() {
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
          const startTime = DateTime.fromISO(this.selectedTimesForWeek[day+'StartTime'], {setZone: true}).toFormat('HH:mm:ss')
          const capacity = this.getCapacity(this.selectedTimesForWeek[day+'StartTime'], this.selectedTimesForWeek[day+'EndTime'])
          if(startTime && capacity) {
            payload[day+'StartTime'] = startTime
            payload[day+'Capacity'] = capacity
          }
        })
      }

      if(!Object.keys(payload).length) {
        showToast(translate("Please check start time and end time entries. End time cannot be less than start time."))
        return;
      }

      if(this.facilityCalendar?.calendarId) {
        try {
          const resp = await FacilityService.removeFacilityCalendar({
            facilityId: this.facilityId,
            calendarId: this.facilityCalendar.calendarId,
            facilityCalendarTypeId: this.facilityCalendar.facilityCalendarTypeId,
            fromDate: this.facilityCalendar.fromDate
          })

          if(!hasError(resp)) {
            await this.addCustomSchedule(payload)
          } else {
            throw resp.data;
          }
        } catch(err) {
          logger.error(err)
        }
      } else {
        await this.addCustomSchedule(payload)
      }
    },
    async addCustomSchedule(payload: any) {
      let resp;
      let calendarId;

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
            await this.store.dispatch('util/fetchCalendars')
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
    },
    getTime(time: any) {
      return DateTime.fromISO(time, {setZone: true}).toFormat('hh:mm a')
    }
  },
  setup() {
    const store = useStore();

    return {
      closeCircle,
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
  --height: 252px;
  --border-radius: 8px;
}
ion-modal.date-time-modal::part(backdrop) {
  --backdrop-opacity: 0.32;
}
</style>