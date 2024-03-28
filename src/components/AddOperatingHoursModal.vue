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
    <ion-accordion-group v-model="selectedCalendarId" >
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
  
<script lang="ts">
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
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { showToast } from "@/utils";
import emitter from "@/event-bus";

export default defineComponent({
  name: "AddOperatingHoursModal",
  components: { 
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
  },
  data() {
    return {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      selectedCalendarId: '' as any
    }
  },
  props: ["facilityId"],
  computed: {
    ...mapGetters({
      calendars: 'util/getCalendars',
      facilityCalendar: 'facility/getFacilityCalendar'
    })
  },
  beforeMount() {
    this.selectedCalendarId = this.facilityCalendar.calendarId
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    saveOperatingHours() {
      if(this.facilityCalendar?.calendarId) {
        this.updateOperatingHours()
      } else {
        this.addOperatingHours()
      }
    },
    async addOperatingHours() {
      emitter.emit('presentLoader')

      try {
        const resp = await FacilityService.associateCalendarToFacility({
          facilityId: this.facilityId,
          calendarId: this.selectedCalendarId,
          fromDate: DateTime.now().toMillis(),
          facilityCalendarTypeId: 'OPERATING_HOURS'
        })

        if(!hasError(resp)) {
          showToast(translate("Successfully associated calendar to the facility."))
          await this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to associate calendar to the facility."))
        logger.error(err)
      }

      modalController.dismiss()
      emitter.emit('dismissLoader')
    },
    async updateOperatingHours() {
      emitter.emit('presentLoader')

      let resp;

      try {
        resp = await FacilityService.removeFacilityCalendar({
          facilityId: this.facilityId,
          calendarId: this.facilityCalendar.calendarId,
          facilityCalendarTypeId: this.facilityCalendar.facilityCalendarTypeId,
          fromDate: this.facilityCalendar.fromDate
        })

        if(!hasError(resp)) {
          resp = await FacilityService.associateCalendarToFacility({
            facilityId: this.facilityId,
            calendarId: this.selectedCalendarId,
            fromDate: DateTime.now().toMillis(),
            facilityCalendarTypeId: 'OPERATING_HOURS'
          })

          if(!hasError(resp)) {
            showToast(translate("Successfully associated calendar to the facility."))
            await this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
          } else {
            throw resp.data
          }
        } else {
          throw resp.data;
        }
      } catch(err) {
        showToast(translate("Failed to associate calendar to the facility."))
        logger.error(err)
      }

      modalController.dismiss()
      emitter.emit('dismissLoader')
    },
    getStartAndEndTime(startTime: any, capacity: any) {
      const formatedStartTime = DateTime.fromFormat(startTime, 'HH:mm:ss').toFormat('hh:mm a');
      const endTime = DateTime.fromMillis(DateTime.fromFormat(startTime, 'HH:mm:ss').toMillis() + capacity).toFormat('hh:mm a')
      return `${formatedStartTime} - ${endTime}`
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
</style>