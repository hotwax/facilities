<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Sell Online") }}</ion-list-header>
      <ion-item v-for="inventoryGroup in getAssociatedInventoryGroups()" :key="inventoryGroup.facilityGroupId">
        <ion-checkbox label-placement="start" :checked="inventoryGroup.isChecked" @click.prevent="updateSellInventoryOnlineSetting($event, inventoryGroup)">
          {{ inventoryGroup?.facilityGroupName ? inventoryGroup.facilityGroupName : inventoryGroup.facilityGroupId }}
        </ion-checkbox>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { IonCheckbox, IonContent, IonItem, IonList, IonListHeader } from '@ionic/vue';
import { computed, defineProps, ref } from "vue"
import { translate } from "@hotwax/dxp-components";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import { DateTime } from 'luxon';
import logger from "@/logger";
import emitter from '@/event-bus'
import store from "@/store";
import { FacilityService } from "@/services/FacilityService";

const props = defineProps(["facility"]);
let currentFacility = ref(props.facility);

const facilities = computed(() => store.getters["facility/getFacilities"]);
const inventoryGroups = computed(() => store.getters['util/getInventoryGroups'])

function getAssociatedInventoryGroups() {
  inventoryGroups.value.forEach((group: any) => {
    group.isChecked = (currentFacility.value.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId));
  });
  return inventoryGroups.value;
}

async function updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");

  // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
  const isChecked = !event.target.checked;

  try {
    let resp;
    let successMessage;
    if(isChecked) {
      resp = await FacilityService.addFacilityToGroup({
        "facilityId": currentFacility.value.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId
      });
      successMessage = translate('is now selling on', { "facilityName": currentFacility.value.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
    } else {
      const groupInformation = currentFacility.value.groupInformation.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId)
      resp = await FacilityService.updateFacilityToGroup({
        "facilityId": currentFacility.value.facilityId,
        "facilityGroupId": facilityGroup.facilityGroupId,
        "fromDate": groupInformation.fromDate,
        "thruDate": DateTime.now().toMillis()
      })
      successMessage = translate('no longer sells on', { "facilityName": currentFacility.value.facilityName, "facilityGroupId": facilityGroup.facilityGroupName })
    }
    if(!hasError(resp)) {
      showToast(successMessage)
      const updatedGroupInformation = await FacilityService.fetchFacilityGroupInformation([currentFacility.value.facilityId])
      currentFacility.value.groupInformation = Object.values(updatedGroupInformation)[0]
    } else {
      throw resp.data
    }
  } catch(err) {
    showToast(translate('Failed to update sell inventory online setting'))
    logger.error('Failed to update sell inventory online setting', err)
  }
  emitter.emit("dismissLoader");

  // Update the facility list to reflect the change in sell online status
  const facilitiesList = JSON.parse(JSON.stringify(facilities.value));
  const updatedFacilities = facilitiesList.map((facility: any) => {
    if(facility.facilityId === currentFacility.value.facilityId) {
      facility.sellOnline = currentFacility.value.groupInformation.some((facilityGroup: any) => facilityGroup.facilityGroupTypeId === 'CHANNEL_FAC_GROUP');
      facility.groupInformation = currentFacility.value.groupInformation;
    }
    return facility;
  });
  store.dispatch('facility/updateFacilities', updatedFacilities);
}
</script>