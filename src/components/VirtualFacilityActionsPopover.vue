<template>
  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ facility.facilityName }}
      </ion-list-header>
      <ion-item button @click="renameVirtualFacility()">
        {{ translate("Rename") }}
      </ion-item>
      <ion-item button @click="archiveVirtualFacility()" lines="none">
        {{ translate("Archive") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>
  
<script setup lang="ts">
import {
  alertController,
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  popoverController
} from "@ionic/vue";
import { translate, commonUtil } from "@common"
import logger from "@/logger";
import { useFacilityStore } from "@/store/facility";
import { computed } from "vue";

const props = defineProps(['facility']);
const facilityStore = useFacilityStore();
const virtualFacilities = computed(() => facilityStore.getVirtualFacilities);

async function renameVirtualFacility() {
  const alert = await alertController.create({
    header: translate('Rename parking'),
    inputs: [{
      name: "facilityName",
      value: props.facility.facilityName
    }],
    buttons: [{
      text: translate('Cancel'),
      role: "cancel"
    },
    {
      text: translate('Apply'),
      handler: (data) => {
        const { facilityName } = data;
        popoverController.dismiss(facilityName);
      }
    }]
  });
  await alert.present();
}

async function archiveVirtualFacility() {
  let facilityGroupId = await fetchArchiveGroup();

  if (!facilityGroupId) {
    facilityGroupId = await createArchiveGroup();
  }

  if (!facilityGroupId) {
    commonUtil.showToast(translate('Failed to archive parking.'));
    return;
  }

  try {
    const resp = await useFacilityStore().addFacilityToGroup({
      facilityId: props.facility.facilityId,
      facilityGroupId
    });

    if (!commonUtil.hasError(resp)) {
      const updatedVirtualFacilities = JSON.parse(JSON.stringify(virtualFacilities.value))
        .filter((facility: any) => facility.facilityId !== props.facility.facilityId);
      facilityStore.updateVirtualFacilities(updatedVirtualFacilities);
      await facilityStore.fetchArchivedFacilities();
      commonUtil.showToast(translate("Parking archived successfully."));
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate('Failed to archive parking.'));
    logger.error('Failed to archive parking.', error);
  }

  popoverController.dismiss();
}

async function fetchArchiveGroup() {
  // checking if the archive group exists and return the facilityGroupId if it does
  let fetchedFacilityGroupId = '';
  try {
    const resp = await facilityStore.fetchFacilityGroup('ARCHIVE');
    if (!commonUtil.hasError(resp)) {
      fetchedFacilityGroupId = resp.data?.facilityGroupId || '';
    }
  } catch (error) {
    logger.error(error);
  }
  return fetchedFacilityGroupId;
}

async function createArchiveGroup() {
  let createdFacilityGroupId = '';
  try {
    const resp = await facilityStore.createFacilityGroup({
      facilityGroupName: 'Archive',
      facilityGroupId: 'ARCHIVE',
      facilityGroupTypeId: '', // TODO need to decide group type ID
    });

    if (!commonUtil.hasError(resp)) {
      createdFacilityGroupId = resp.data.facilityGroupId;
    } else {
      throw resp.data;
    }

  } catch (error) {
    commonUtil.showToast(translate('Failed to archive parking.'));
    logger.error('Failed to archive parking.', error);
  }
  return createdFacilityGroupId;
}
</script>