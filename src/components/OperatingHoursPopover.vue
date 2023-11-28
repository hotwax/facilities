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
          {{ translate("Add custom schedules") }}
        </ion-label>
      </ion-item>
      <ion-item button lines="none">
        <ion-label>
          {{ translate("Remove schedules") }}
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
import AddOperatingHoursModal from "@/components/AddOperatingHoursModal.vue";
import CustomScheduleModal from "@/components/CustomScheduleModal.vue";

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
        component: CustomScheduleModal
      })
      
      customScheduleModal.present()
    }
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
