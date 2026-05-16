<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("New parking") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="createVirtualFacility">
      <ion-list>
        <ion-item>
          <ion-input label-placement="floating" @ionBlur="setFacilityId($event)" v-model="formData.facilityName">
            <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
          </ion-input>
        </ion-item>
        <ion-item lines="none">
          <ion-input :label="translate('Internal ID')" label-placement="floating" ref="facilityIdInput" v-model="formData.facilityId" @ionInput="validateFacilityId" @ionBlur="markFacilityIdTouched" :error-text="translate('Internal ID cannot be more than 20 characters.')"/>
        </ion-item>
        <ion-item>
          <ion-input label-placement="floating" :label="translate('Description')" v-model="formData.description"/>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createVirtualFacility" @keyup.enter.stop>
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
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import { FacilityService } from "@/services/FacilityService";
import { commonUtil } from "@common";
import { generateInternalId } from "@/utils";
import logger from "@/logger";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed } from "vue";

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const virtualFacilities = computed(() => facilityStore.getVirtualFacilities);
const organizationPartyId = computed(() => utilStore.getOrganizationPartyId);

const formData = ref({
  facilityName: '',
  facilityId: '',
  description: '',
});
const isAutoGenerateId = ref(true);
const facilityIdInput = ref(null as any);

function setFacilityId(event: any) {
  if (isAutoGenerateId.value) {
    formData.value.facilityId = generateInternalId(event.target.value);
  }
}

function closeModal() {
  modalController.dismiss();
}

async function createVirtualFacility() {
  if (!formData.value.facilityName?.trim()) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  if (formData.value.facilityId.length > 20) {
    commonUtil.showToast(translate('Internal ID cannot be more than 20 characters.'));
    return;
  }

  // In case the user does not lose focus from the facility name input
  // and click on create the button, we need to set the internal id manually
  if (!formData.value.facilityId) {
    formData.value.facilityId = generateInternalId(formData.value.facilityName);
  }

  try {
    const payload = {
      ...formData.value,
      facilityTypeId: 'VIRTUAL_FACILITY',
      ownerPartyId: organizationPartyId.value
    };

    const resp = await FacilityService.createVirtualFacility(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("New parking created successfully."));
      const createdFacility = {
        ...formData.value,
        facilityTypeId: 'VIRTUAL_FACILITY',
        orderCount: 0
      };
      const updatedVirtualFacilities = [...virtualFacilities.value, createdFacility];
      facilityStore.updateVirtualFacilities(updatedVirtualFacilities);
    } else {
      throw resp.data;
    }
  } catch (error: any) {
    logger.error(error);
    if (error?.response?.data?.error?.message) {
      commonUtil.showToast(error.response.data.error.message);
    } else {
      commonUtil.showToast(translate('Failed to create parking.'));
    }
  }
  modalController.dismiss();
}

function validateFacilityId(event: any) {
  const value = event.target.value;
  if (!facilityIdInput.value) return;

  const el = facilityIdInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  formData.value.facilityId.length <= 20
    ? el.classList.add('ion-valid')
    : el.classList.add('ion-invalid');
  isAutoGenerateId.value = false;
}

function markFacilityIdTouched() {
  if (facilityIdInput.value) {
    facilityIdInput.value.$el.classList.add('ion-touched');
  }
}
</script>