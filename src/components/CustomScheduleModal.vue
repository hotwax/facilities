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
      <ion-input v-model="selectedTimesForWeek.description">
        <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
      </ion-input>
    </ion-item>
    <ion-item lines="full" class="ion-margin-top">
      <ion-toggle :checked="isDailyTimingsChecked" @ionChange="updateDailyTimings">{{ translate("Daily timings") }}</ion-toggle>
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
      :value="selectedTimesForWeek[selectedDayTime] ? selectedTimesForWeek[selectedDayTime] : DateTime.now().toUTC().toISO()"
      @ionChange="updateTime($event)"
    />
  </ion-modal>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button :disabled="!Object.keys(selectedTimesForWeek).length || !selectedTimesForWeek.description?.trim()" @click="saveCustomSchedule">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script setup lang="ts">
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
import { closeCircle, closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import logger from "@/logger";
import { commonUtil } from "@common";
import { DateTime } from "luxon";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import emitter from "@/event-bus";
import { ref, computed } from "vue";

const props = defineProps(['facilityId']);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const facilityCalendar = computed(() => facilityStore.getFacilityCalendar);

const isDailyTimingsChecked = ref(false);
const days = ref(['Daily']);
const selectedTimesForWeek = ref({} as any);
const selectedDayTime = ref('');
const isTimeModalOpen = ref(false);

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

function clearSelectedTime(dayTime: string) {
  selectedTimesForWeek.value[dayTime] = '';
}

async function openTimeModal(dayTime: string) {
  selectedDayTime.value = dayTime;
  isTimeModalOpen.value = true;
}

function updateTime(event: CustomEvent) {
  selectedTimesForWeek.value[selectedDayTime.value] = event.detail.value;
}

function updateDailyTimings() {
  isDailyTimingsChecked.value = !isDailyTimingsChecked.value;
  days.value = isDailyTimingsChecked.value ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] : ['Daily'];
}

async function addCustomSchedule(payload: any) {
  try {
    let resp = await facilityStore.createFacilityCalendar({ ...payload, description: selectedTimesForWeek.value.description.trim() });
    if (!commonUtil.hasError(resp)) {
      const calendarId = resp.data.calendarId;

      resp = await facilityStore.associateCalendarToFacility({
        facilityId: props.facilityId,
        calendarId: calendarId,
        fromDate: DateTime.now().toMillis(),
        facilityCalendarTypeId: 'OPERATING_HOURS'
      });

      if (!commonUtil.hasError(resp)) {
        commonUtil.showToast(translate("Successfully created and associated calendar to the facility."));
        await facilityStore.fetchFacilityCalendar({ facilityId: props.facilityId });
        await utilStore.fetchCalendars();
        modalController.dismiss();
      } else {
        throw resp.data;
      }
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate("Failed to create calendar to the facility."));
    logger.error(err);
  }
}

async function saveCustomSchedule() {
  const payload = {} as any;

  if (days.value.length === 1) {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dailyStartTime = DateTime.fromISO(selectedTimesForWeek.value['DailyStartTime'], { setZone: true }).toFormat('HH:mm:ss');
    const dailyCapacity = getCapacity(selectedTimesForWeek.value['DailyStartTime'], selectedTimesForWeek.value['DailyEndTime']);
    if (dailyStartTime && dailyCapacity) {
      weekDays.forEach((day: string) => {
        payload[day + 'StartTime'] = dailyStartTime;
        payload[day + 'Capacity'] = dailyCapacity;
      });
    }
  } else {
    days.value.forEach((day: string) => {
      const startTime = DateTime.fromISO(selectedTimesForWeek.value[day + 'StartTime'], { setZone: true }).toFormat('HH:mm:ss');
      const capacity = getCapacity(selectedTimesForWeek.value[day + 'StartTime'], selectedTimesForWeek.value[day + 'EndTime']);
      if (startTime && capacity) {
        payload[day + 'StartTime'] = startTime;
        payload[day + 'Capacity'] = capacity;
      }
    });
  }

  if (!Object.keys(payload).length) {
    commonUtil.showToast(translate("Please check start time and end time entries. End time cannot be less than start time."));
    return;
  }

  emitter.emit('presentLoader');

  if (facilityCalendar.value?.calendarId) {
    try {
      const resp = await facilityStore.removeFacilityCalendar({
        facilityId: props.facilityId,
        calendarId: facilityCalendar.value.calendarId,
        facilityCalendarTypeId: facilityCalendar.value.facilityCalendarTypeId,
        fromDate: facilityCalendar.value.fromDate
      });

      if (!commonUtil.hasError(resp)) {
        await addCustomSchedule(payload);
      } else {
        throw resp.data;
      }
    } catch (err) {
      logger.error(err);
    }
  } else {
    await addCustomSchedule(payload);
  }

  emitter.emit('dismissLoader');
}

function getCapacity(startTime: any, endTime: any) {
  const formatedStartTime = DateTime.fromISO(startTime, { setZone: true }).toMillis();
  const formatedEndTime = DateTime.fromISO(endTime, { setZone: true }).toMillis();

  if (formatedEndTime <= formatedStartTime) {
    return null;
  }

  return formatedEndTime - formatedStartTime;
}

function getTime(time: any) {
  return DateTime.fromISO(time, { setZone: true }).toFormat('hh:mm a');
}
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