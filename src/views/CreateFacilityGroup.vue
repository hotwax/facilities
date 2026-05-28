<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-groups" slot="start" />
        <ion-title>{{ translate("New group") }}</ion-title>
      </ion-toolbar>
    </ion-header>
  
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Create a new group') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-input label-placement="floating" @ionBlur="setFacilityGroupId($event)" v-model="formData.facilityGroupName">
                <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-input label-placement="floating" :label="translate('Internal ID')" ref="facilityGroupIdInput" v-model="formData.facilityGroupId" @ionInput="validateFacilityGroupId" @ionBlur="markFacilityGroupIdTouched" :error-text="translate('Internal ID cannot be more than 20 characters.')" />
            </ion-item>
            <ion-item>
              <ion-select :label="translate('Group type')" :disabled="isFacilityGroupTypeDisabled" :placeholder="translate('Select')" interface="popover" v-model="formData.facilityGroupTypeId">
                <ion-select-option :value="facilityGroupType.facilityGroupTypeId" :key="facilityGroupType.facilityGroupTypeId" v-for="facilityGroupType in facilityGroupTypes">
                  {{  facilityGroupType.description ?  facilityGroupType.description : facilityGroupType.facilityGroupTypeId }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-select v-if="productStores.length" :label="translate('Product store')" :placeholder="translate('Select')" :selected-text="selectedProductStoreIds.length > 1 ? translate('product stores', { count: selectedProductStoreIds.length }) : selectedProductStoreIds[0]" :value="selectedProductStoreIds" @ionChange="updateFacilityGroupProductStores($event)" :multiple="true">
                <ion-select-option :value="productStore.productStoreId" :key="productStore.productStoreId" v-for="productStore in productStores">
                  {{ productStore.storeName ? productStore.storeName : productStore.productStoreId }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-textarea :label="translate('Description')" label-placement="floating"
                :placeholder="translate('group description')"
                :auto-grow="true"
                :counter="true" 
                :maxlength="255"
                v-model="formData.description"
              >
              </ion-textarea>
            </ion-item>
          </ion-list>
        </ion-card>
        <div class="ion-text-center ion-margin">
          <ion-button @click="createFacilityGroup()">
            {{ translate("Create group") }}
            <ion-icon slot="end" :icon="arrowForwardOutline"/>
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
  IonTextarea,
  IonTitle,
  IonToolbar,
  alertController
} from "@ionic/vue";
import { ref, computed, reactive, onMounted } from "vue";
import { arrowForwardOutline } from "ionicons/icons";
import { commonUtil, translate } from "@common"
import { generateInternalId } from "@/utils";
import logger from "@/logger";
import { DateTime } from "luxon";
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';
import router from "@/router";

const props = defineProps(['selectedFacilityGroupTypeId']);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const formData = reactive({
  facilityGroupId: '',
  facilityGroupName: '',
  facilityGroupTypeId: '',
  description: '',
});
const isFacilityGroupTypeDisabled = ref(false);
const selectedProductStoreIds = ref([] as string[]);
const isAutoGenerateId = ref(true);
const facilityGroupIdInput = ref(null as any);

const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);
const productStores = computed(() => utilStore.getProductStores);

onMounted(async () => {
  await Promise.all([utilStore.fetchProductStores(), utilStore.fetchFacilityGroupTypes()]);
  if (props.selectedFacilityGroupTypeId) {
    formData.facilityGroupTypeId = props.selectedFacilityGroupTypeId;
    isFacilityGroupTypeDisabled.value = true;
  }
});

function updateFacilityGroupProductStores(event: any) {
  selectedProductStoreIds.value = event.detail.value;
}

function setFacilityGroupId(event: any) {
  if (isAutoGenerateId.value) {
    formData.facilityGroupId = generateInternalId(event.target.value);
  }
}

async function createFacilityGroup() {
  if (!formData.facilityGroupName?.trim()) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  if (formData.facilityGroupId.length > 20) {
    commonUtil.showToast(translate('Internal ID cannot be more than 20 characters.'));
    return;
  }

  if (!formData.facilityGroupId) {
    formData.facilityGroupId = generateInternalId(formData.facilityGroupName);
  }

  try {
    const payload = {
      ...formData,
    };

    const resp = await facilityStore.createFacilityGroup(payload);
    if (!commonUtil.hasError(resp)) {
      const facilityGroupId = resp.data.facilityGroupId;
      if (selectedProductStoreIds.value.length > 0) {
        await associateFacilityGroupToStore(facilityGroupId, selectedProductStoreIds.value);
      }
      await manageFacilityAlert(facilityGroupId);
    } else {
      throw resp.data;
    }
  } catch (error) {
    logger.error(error);
    commonUtil.showToast(translate('Failed to create facility group.'));
  }
}

async function associateFacilityGroupToStore(facilityGroupId: string, productStoreIds: string[]) {
  try {
    const responses = await Promise.allSettled(productStoreIds
      .map(async (productStoreId: any) => await facilityStore.createProductStoreFacilityGroup({
        "productStoreId": productStoreId,
        "facilityGroupId": facilityGroupId,
        "fromDate": DateTime.now().toMillis()
      }))
    );
    const hasFailedResponse = responses.some((response: any) => response.status === 'rejected');
    if (hasFailedResponse) {
      console.log("Error in associating group to some of the product stores");
    }
  } catch (error) {
    logger.error(error);
  }
}

async function manageFacilityAlert(facilityGroupId: string) {
  const message = 'Creating group without facilities is essentially empty. Would you prefer to associate facilities during group creation or allow for later addition?';
  const alert = await alertController.create({
    header: translate('Add facilities'),
    message: translate(message),
    backdropDismiss: false,
    buttons: [
      {
        text: translate("Skip"),
        handler: async () => {
          router.replace({ path: `/tabs/find-groups`});
        }
      },
      {
        text: translate("Add"),
        handler: async () => {
          router.replace({ path: `/manage-facilities/${facilityGroupId}`});
        }
      }
    ],
  });
  return alert.present();
}

function validateFacilityGroupId(event: any) {
  const value = event.target.value;
  if (!facilityGroupIdInput.value) return;

  const el = facilityGroupIdInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  formData.facilityGroupId.length <= 20
    ? el.classList.add('ion-valid')
    : el.classList.add('ion-invalid');
  isAutoGenerateId.value = false;
}

function markFacilityGroupIdTouched() {
  if (facilityGroupIdInput.value) {
    facilityGroupIdInput.value.$el.classList.add('ion-touched');
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
