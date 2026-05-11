<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Add operating hours") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-accordion-group :value="selectedCalendarId">
      <ion-radio-group v-model="selectedCalendarId">
        <ion-accordion v-for="calendar in calendars" :key="calendar.calendarId" :value="calendar.calendarId">
          <ion-item slot="header">
            <ion-radio label-placement="end" justify="start" :value="calendar.calendarId">
              <ion-label class="ion-text-wrap">
                {{ calendar.description ? calendar.description : calendar.calendarId }}
              </ion-label>
            </ion-radio>
          </ion-item>
          <div class="ion-padding" slot="content">
            <ion-list lines="none">
              <ion-item v-for="day in days" :key="day">
                <ion-label>
                  <p>{{ translate(day.charAt(0).toUpperCase() + day.slice(1)) }}</p>
                </ion-label>
                <ion-label slot="end">
                  <p>{{ calendar[day+'StartTime'] ? getStartAndEndTime(calendar[day+'StartTime'], calendar[day+'Capacity']) : translate('Closed') }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </div>
        </ion-accordion>
      </ion-radio-group>
    </ion-accordion-group>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button :disabled="!selectedCalendarId || facilityCalendar.calendarId === selectedCalendarId" @click="saveOperatingHours()">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>
  
<script setup lang="ts">
import { 
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { showToast } from "@/utils";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed, onBeforeMount } from "vue";

const props = defineProps(["facilityId"]);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const selectedCalendarId = ref('' as any);

const calendars = computed(() => utilStore.getCalendars);
const facilityCalendar = computed(() => facilityStore.getFacilityCalendar);

onBeforeMount(() => {
  selectedCalendarId.value = facilityCalendar.value.calendarId;
});

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

function saveOperatingHours() {
  if (facilityCalendar.value?.calendarId) {
    updateOperatingHours();
  } else {
    addOperatingHours();
  }
}

async function addOperatingHours() {
  emitter.emit('presentLoader');

  try {
    const resp = await FacilityService.associateCalendarToFacility({
      facilityId: props.facilityId,
      calendarId: selectedCalendarId.value,
      fromDate: DateTime.now().toMillis(),
      facilityCalendarTypeId: 'OPERATING_HOURS'
    });

    if (!hasError(resp)) {
      showToast(translate("Successfully associated calendar to the facility."));
      await facilityStore.fetchFacilityCalendar({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate("Failed to associate calendar to the facility."));
    logger.error(err);
  }

  modalController.dismiss();
  emitter.emit('dismissLoader');
}

async function updateOperatingHours() {
  emitter.emit('presentLoader');

  try {
    let resp = await FacilityService.removeFacilityCalendar({
      facilityId: props.facilityId,
      calendarId: facilityCalendar.value.calendarId,
      facilityCalendarTypeId: facilityCalendar.value.facilityCalendarTypeId,
      fromDate: facilityCalendar.value.fromDate
    });

    if (!hasError(resp)) {
      resp = await FacilityService.associateCalendarToFacility({
        facilityId: props.facilityId,
        calendarId: selectedCalendarId.value,
        fromDate: DateTime.now().toMillis(),
        facilityCalendarTypeId: 'OPERATING_HOURS'
      });

      if (!hasError(resp)) {
        showToast(translate("Successfully associated calendar to the facility."));
        await facilityStore.fetchFacilityCalendar({ facilityId: props.facilityId });
      } else {
        throw resp.data;
      }
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate("Failed to associate calendar to the facility."));
    logger.error(err);
  }

  modalController.dismiss();
  emitter.emit('dismissLoader');
}

function getStartAndEndTime(startTime: any, capacity: any) {
  const formatedStartTime = DateTime.fromFormat(startTime, 'HH:mm:ss').toFormat('hh:mm a');
  const endTime = DateTime.fromMillis(DateTime.fromFormat(startTime, 'HH:mm:ss').toMillis() + capacity).toFormat('hh:mm a');
  return `${formatedStartTime} - ${endTime}`;
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>