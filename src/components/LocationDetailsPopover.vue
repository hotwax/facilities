<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Location details") }}</ion-list-header>
      <ion-item button @click="addLocationModal">
        {{ translate("Edit location") }}
      </ion-item>
      <ion-item button lines="none" @click="removeLocation">
        {{ translate("Remove location") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  modalController,
  popoverController
} from "@ionic/vue";
import { translate } from "@hotwax/dxp-components";
import AddLocationModal from "./AddLocationModal.vue";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { computed } from "vue";

const props = defineProps(["location"]);
const facilityStore = useFacilityStore();
const current = computed(() => facilityStore.getCurrent);

async function addLocationModal() {
  const addLocationModal = await modalController.create({
    component: AddLocationModal,
    componentProps: { location: props.location }
  });

  await popoverController.dismiss();
  addLocationModal.present();
}

async function removeLocation() {
  emitter.emit('presentLoader');

  const params = {
    facilityId: props.location.facilityId,
    locationSeqId: props.location.locationSeqId
  };

  try {
    const resp = await FacilityService.deleteFacilityLocation(params);

    if (!hasError(resp)) {
      showToast(translate('Facility location removed successfully'));
      await facilityStore.fetchFacilityLocations({ facilityId: current.value.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate('Failed to remove facility location'));
    logger.error('Failed to remove facility location', err);
  }
  popoverController.dismiss();
  emitter.emit('dismissLoader');
}
</script>
