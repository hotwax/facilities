<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("New group") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="createFacilityGroup">
      <ion-list>
        <ion-item>
          <ion-input label-placement="floating" @ionBlur="setFacilityGroupId($event)" v-model="formData.facilityGroupName">
            <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
          </ion-input>
        </ion-item>
        <ion-item lines="none">
          <ion-input label-placement="floating" :label="translate('Internal ID')" ref="facilityGroupIdInput" v-model="formData.facilityGroupId" @ionInput="validateFacilityGroupId" @ionBlur="markFacilityGroupIdTouched" :error-text="translate('Internal ID cannot be more than 20 characters.')" />
        </ion-item>
        <ion-item lines="none">
          <ion-select :label="translate('System group type')" :disabled="isFacilityGroupTypeDisabled" interface="popover" v-model="formData.facilityGroupTypeId">
            <ion-select-option :value="facilityGroupType.facilityGroupTypeId" :key="facilityGroupType.facilityGroupTypeId" v-for="facilityGroupType in facilityGroupTypes">
              {{  facilityGroupType.description ?  facilityGroupType.description : facilityGroupType.facilityGroupTypeId }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input :label="translate('Description')" label-placement="floating" v-model="formData.description"/>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createFacilityGroup" @keyup.enter.stop>
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
  IonSelect,
  IonSelectOption,
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
import { ref, computed, onMounted } from "vue";

const props = defineProps(['selectedFacilityGroupTypeId']);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const groups = computed(() => facilityStore.getFacilityGroups);
const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);

const formData = ref({
  facilityGroupId: '',
  facilityGroupName: '',
  facilityGroupTypeId: '',
  description: '',
});
const isFacilityGroupTypeDisabled = ref(false);
const facilityGroupIdInput = ref(null as any);

onMounted(() => {
  if (props.selectedFacilityGroupTypeId) {
    formData.value.facilityGroupTypeId = props.selectedFacilityGroupTypeId;
    isFacilityGroupTypeDisabled.value = true;
  }
});

function setFacilityGroupId(event: any) {
  formData.value.facilityGroupId = generateInternalId(event.target.value);
}

function closeModal() {
  modalController.dismiss();
}

async function createFacilityGroup() {
  if (!formData.value.facilityGroupName?.trim()) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  if (formData.value.facilityGroupId.length > 20) {
    commonUtil.showToast(translate('Internal ID cannot be more than 20 characters.'));
    return;
  }

  // In case the user does not lose focus from the facility name input
  // and click on create the button, we need to set the internal id manually
  if (!formData.value.facilityGroupId) {
    formData.value.facilityGroupId = generateInternalId(formData.value.facilityGroupName);
  }

  try {
    const payload = {
      ...formData.value,
    };

    const resp = await FacilityService.createFacilityGroup(payload);
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate("Facility group created."));
      const createdGroup = {
        ...formData.value,
        facilityGroupId: resp.data.facilityGroupId,
        facilityCount: 0
      };
      const updatedFacilityGroups = [...groups.value, createdGroup];
      await facilityStore.updateFacilityGroups(updatedFacilityGroups);
      await utilStore.fetchFacilityGroupTypes();
    } else {
      throw resp.data;
    }
  } catch (error) {
    logger.error(error);
    commonUtil.showToast(translate('Failed to create facility group.'));
  }
  modalController.dismiss();
}

function validateFacilityGroupId(event: any) {
  const value = event.target.value;
  if (!facilityGroupIdInput.value) return;

  const el = facilityGroupIdInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  formData.value.facilityGroupId.length <= 20
    ? el.classList.add('ion-valid')
    : el.classList.add('ion-invalid');
}

function markFacilityGroupIdTouched() {
  if (facilityGroupIdInput.value) {
    facilityGroupIdInput.value.$el.classList.add('ion-touched');
  }
}
</script>