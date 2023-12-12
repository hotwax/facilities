<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Operating hours") }}</ion-list-header>
      <ion-item button @click="addOperatingHours">
        <ion-label>
          {{ translate("View other schedules") }}
        </ion-label>
      </ion-item>
      <ion-item button @click="addCustomSchedule">
        <ion-label>
          {{ translate("Add custom schedule") }}
        </ion-label>
      </ion-item>
      <ion-item button lines="none" @click="removeCalendarFromFacility">
        <ion-label>
          {{ translate("Remove schedule") }}
        </ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  modalController,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from "vuex";
import AddOperatingHoursModal from "@/components/AddOperatingHoursModal.vue";
import CustomScheduleModal from "@/components/CustomScheduleModal.vue";
import { FacilityService } from "@/services/FacilityService";
import { showToast } from "@/utils";
import logger from "@/logger";
import { hasError } from "@/adapter";
import emitter from "@/event-bus";

export default defineComponent({
  name: "FacilityMappingPopover",
  components: {
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader
  },
  props: ["facilityId"],
  computed: {
    ...mapGetters({
      facilityCalendar: 'facility/getFacilityCalendar'
    })
  },
  methods: {
    async addOperatingHours() {
      const addOperatingHoursModal = await modalController.create({
        component: AddOperatingHoursModal,
        componentProps: { facilityId: this.facilityId }
      })

      addOperatingHoursModal.onDidDismiss().then(() => {
        popoverController.dismiss()
      })

      addOperatingHoursModal.present()
    },
    async addCustomSchedule() {
      const customScheduleModal = await modalController.create({
        component: CustomScheduleModal,
        componentProps: { facilityId: this.facilityId }
      })

      customScheduleModal.onDidDismiss().then(() => {
        popoverController.dismiss()
      })

      customScheduleModal.present()
    },
    async removeCalendarFromFacility() {
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
          showToast("Successfully revoked calendar associativity with the facility.")
          this.store.dispatch('facility/fetchFacilityCalendar', { facilityId: this.facilityId })
        } else {
          throw resp.data;
        }
      } catch(err) { 
        showToast(translate("Failed to revoke calendar associativity with the facility."))
        logger.error(err)
      }

      popoverController.dismiss()
      emitter.emit('dismissLoader')
    }
  },
  setup() {
    const store = useStore();
    return {
      store,
      translate
    };
  }
});
</script>
