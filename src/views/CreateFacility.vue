<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-facilities" slot="start" />
        <ion-title>{{ translate("Add Store") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Setup Store') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-select :label="translate('Type')" interface="popover" v-model="selectedFacilityTypeId">
                <ion-select-option :value="facilityTypeId" :key="facilityTypeId" v-for="(type, facilityTypeId) in facilityTypesByParentTypeId">
                  {{ type.description ? type.description : facilityTypeId }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input label-placement="floating" @ionBlur="setFacilityId($event)" v-model="formData.facilityName">
                <div slot="label">{{ translate('Name') }} <ion-text color="danger">*</ion-text></div>
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-input :label="translate('Internal ID')" label-placement="floating" ref="facilityIdInput" v-model="formData.facilityId" @ionChange="validateFacilityId" @ionBlur="markFacilityIdTouched" :error-text="translate('Internal ID cannot be more than 20 characters.')" />
            </ion-item>
            <ion-item>
              <ion-input :label="translate('External ID')" label-placement="floating" v-model="formData.externalId" />
            </ion-item>
          </ion-list>
        </ion-card>

        <div class="ion-text-center ion-margin">
          <ion-button @click="createFacility()">
            <ion-icon slot="start" :icon="addOutline"/>
            {{ facilityTypes[selectedFacilityTypeId]?.description ? translate(`Create ${facilityTypes[selectedFacilityTypeId].description}`) : translate(`Create ${selectedFacilityTypeId}`) }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from "@ionic/vue";
import { ref, computed, reactive } from "vue";
import { useRouter, useRoute } from 'vue-router'
import { addOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { generateInternalId, showToast } from "@/utils";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';

const router = useRouter();
const route = useRoute();
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const facilityIdInput = ref(null as any);
const formData = reactive({
  facilityName: '',
  facilityId: '',
  externalId: '',
});
const selectedFacilityTypeId = ref('' as any);
const facilityTypesByParentTypeId = ref({} as any);
const isAutoGenerateId = ref(true);

const facilityTypes = computed(() => utilStore.getFacilityTypes);
const organizationPartyId = computed(() => utilStore.getOrganizationPartyId);

onIonViewWillEnter(async () => {
  clearFormData();
  await Promise.all([
    facilityStore.updateCurrentFacility({}),
    utilStore.fetchFacilityTypes({
      parentTypeId: 'VIRTUAL_FACILITY',
      parentTypeId_op: 'notEqual',
      facilityTypeId: 'VIRTUAL_FACILITY',
      facilityTypeId_op: 'notEqual'
    })
  ]);
  facilityTypesByParentTypeId.value = getFacilityTypesByParentTypeIdFromSelection(route.query.type as string);

  selectedFacilityTypeId.value = facilityTypesByParentTypeId.value['RETAIL_STORE'] 
    ? 'RETAIL_STORE' 
    : facilityTypesByParentTypeId.value['WAREHOUSE'] 
      ? 'WAREHOUSE' 
      : Object.keys(facilityTypesByParentTypeId.value)[0];
});

function clearFormData() {
  formData.facilityName = '';
  formData.facilityId = '';
  formData.externalId = '';
  isAutoGenerateId.value = true;
}

function setFacilityId(event: any) {
  if (isAutoGenerateId.value) {
    formData.facilityId = generateInternalId(event.target.value);
  }
}

async function createFacility() {
  if (!formData.facilityName?.trim()) {
    showToast(translate('Facility name is required.'));
    return;
  }

  if (formData.facilityId.length > 20) {
    showToast(translate('Internal ID cannot be more than 20 characters.'));
    return;
  }

  if (!formData.facilityId) {
    formData.facilityId = generateInternalId(formData.facilityName);
  }

  try {
    const payload = {
      ...formData,
      facilityTypeId: selectedFacilityTypeId.value,
      ownerPartyId: organizationPartyId.value
    };

    const resp = await FacilityService.createFacility(payload);
    if (!hasError(resp)) {
      const { facilityId } = resp.data;
      showToast(translate("Facility created successfully."));
      facilityStore.updateCurrentFacility(payload);
      router.replace(`/add-facility-address/${facilityId}`);
    } else {
      throw resp.data;
    }
  } catch (error: any) {
    logger.error(error);
    if (error?.response?.data?.error?.message) {
      showToast(error.response.data.error.message);
    } else {
      showToast(translate('Failed to create facility.'));
    }
    return;
  }

  await FacilityService.createFacilityLocation({
    facilityId: formData.facilityId,
    locationTypeEnumId: "FLT_PICKLOC",
    areaId: "TL",
    aisleId: "TL",
    sectionId: "TL",
    levelId: "LL",
    positionId: "01",
  });
}

function getFacilityTypesByParentTypeIdFromSelection(parentTypeId: string) {
  return parentTypeId ? Object.keys(facilityTypes.value).reduce((acc: any, facilityTypeId: string) => {
    if (facilityTypes.value[facilityTypeId].parentTypeId === parentTypeId) {
      acc[facilityTypeId] = facilityTypes.value[facilityTypeId];
    }
    return acc;
  }, {}) : facilityTypes.value;
}

function validateFacilityId(event: any) {
  const value = event.target.value;
  if (!facilityIdInput.value) return;

  const el = facilityIdInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  formData.facilityId.length <= 20
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

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>