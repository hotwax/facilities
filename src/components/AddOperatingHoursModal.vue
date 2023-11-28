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
          <ion-item slot="header" color="light">
            <ion-radio :value="calendar.calendarId" slot="start" />
            <ion-label class="ion-text-wrap">
              {{ calendar.description }}
            </ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">First Content</div>
        </ion-accordion>
      </ion-radio-group>
    </ion-accordion-group>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="addOperatingHours">
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
    IonRadio,
    IonRadioGroup,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      selectedCalendarId: 'DEFAULT'
    }
  },
  props: ["facilityId"],
  computed: {
    ...mapGetters({
      calendars: 'util/getCalendars',
      facilityCalendar: 'facility/getFacilityCalendar'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async addOperatingHours() {
      let resp;
      try {
        resp = await this.removeCalendarFromFacility()

        if(hasError(resp)) {
          throw resp.data;
        }
      } catch(err) {
        showToast(translate("Failed to associate calendar to the facility."))
        logger.error(err)
        modalController.dismiss()
        return;
      }

      if(this.selectedCalendarId && this.selectedCalendarId !== this.facilityCalendar.calendarId) {
        try {
          resp = await FacilityService.associateCalendarToFacility({
            storeId: this.facilityId,
            calendarId: this.selectedCalendarId,
            fromDateStr: DateTime.now().toFormat('MM/dd/yyyy')
          })

          if(!hasError(resp)) {
            showToast(translate("Successfully associated calendar to the facility."))
          } else {
            throw resp.data
          }
        } catch(err) {
          showToast(translate("Failed to associate calendar to the facility."))
          logger.error(err)
        }
      }

      this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
      modalController.dismiss()
    },
    async removeCalendarFromFacility() {
      return await FacilityService.associateCalendarToFacility({
        storeId: this.facilityId,
        calendarId: this.facilityCalendar.calendarId,
        thruDateStr: DateTime.now().toFormat('MM/dd/yyyy'),
        facilityCalendarTypeId: this.facilityCalendar.facilityCalendarTypeId,
        fromDateStr: DateTime.fromMillis(this.facilityCalendar.fromDate).toFormat('MM/dd/yyyy')
      })
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