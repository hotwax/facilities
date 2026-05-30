<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Custom mapping") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Facility details") }}</ion-list-header>
      <ion-item>
        <ion-label>{{ translate("Facility ID") }}</ion-label>
        <p>{{ currentFacility.facilityId }}</p>
      </ion-item>
      <ion-item lines="none">
        <ion-label>{{ translate("Facility name") }}</ion-label>
        <p>{{ currentFacility.facilityName }}</p>
      </ion-item>
    </ion-list>
    <form @keyup.enter="saveMapping" @submit.prevent>
      <ion-list>
        <ion-list-header>{{ translate("Custom mapping") }}</ion-list-header>
        <ion-item>
          <ion-input id="inputElement" :label="translate('Mapping ID')" v-model="mappingId" placeholder="Mapping ID" />
        </ion-item>
        <ion-item>
          <ion-input :label="translate('Mapping Name')" v-model="mappingName" placeholder="Mapping name" />
        </ion-item>
        <ion-item>
          <ion-input :label="translate('Identification')" v-model="mappingValue" placeholder="Mapping Value" />
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="saveMapping">
          <ion-icon :icon="saveOutline" />
        </ion-fab-button>
      </ion-fab>
    </form>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import { commonUtil } from "@common";
import logger from "@/logger";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed } from "vue";

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();
const currentFacility = computed(() => facilityStore.getCurrent);

const mappingId = ref('');
const mappingName = ref('');
const mappingValue = ref('');

function closeModal() {
  modalController.dismiss();
}

async function saveMapping() {
  if (!mappingId.value.trim() || !mappingName.value.trim() || !mappingValue.value.trim()) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  emitter.emit('presentLoader');

  try {
    let resp = await facilityStore.createEnumeration({
      "enumId": mappingId.value,
      "enumTypeId": "FACILITY_IDENTITY",
      "description": mappingName.value
    });

    if (!commonUtil.hasError(resp) && resp.data.enumId) {
      resp = await facilityStore.createFacilityIdentification({
        "facilityId": currentFacility.value.facilityId,
        "facilityIdenTypeId": resp.data.enumId,
        "idValue": mappingValue.value
      });

      if (!commonUtil.hasError(resp)) {
        commonUtil.showToast(translate('External mapping created successfully'));
        // fetching external mapping types again, as we have created a new mapping type that needs to be included in popover
        // added skipState property to not check for cached type and always make an api call
        await utilStore.fetchExternalMappingTypes({ skipState: true });
        facilityStore.fetchFacilityMappings({ facilityId: currentFacility.value.facilityId });
        closeModal();
      } else {
        throw resp.data;
      }
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to create external mapping'));
    logger.error('Failed to create external mapping', err);
  }

  emitter.emit('dismissLoader');
}
</script>