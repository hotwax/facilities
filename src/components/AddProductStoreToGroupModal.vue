<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Product stores") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-item v-for="productStore in productStores" :key="productStore.productStoreId" @click="toggleProductStoreSelection(productStore)" >
        <ion-checkbox :checked="isSelected(productStore.productStoreId)">
          <ion-label>
            {{ productStore.storeName }}
            <p>{{ productStore.productStoreId }}</p>
          </ion-label>
        </ion-checkbox>
      </ion-item>
    </ion-list>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!areProductStoresUpdated()" @click="saveProductStores()">
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script setup lang="ts">
import { 
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import logger from "@/logger";
import { commonUtil } from "@common";
import { DateTime } from "luxon";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed, onMounted } from "vue";

const props = defineProps(["group"]);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const productStores = computed(() => utilStore.getProductStores);
const groups = computed(() => facilityStore.getFacilityGroups);

const selectedProductStores = ref([] as any);
const selectedProductStoreValues = ref([] as any);

onMounted(async () => {
  await utilStore.fetchProductStores();
  fetchGroupProductStores();
});

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

async function fetchGroupProductStores() {
  emitter.emit('presentLoader');
  try {
    const resp = await facilityStore.fetchGroupProductStores({
      customParametersMap: {
        facilityGroupId: props.group.facilityGroupId,
        pageSize: 250
      },
      filterByDate: true,
    });

    if (!commonUtil.hasError(resp)) {
      selectedProductStores.value = resp.data?.entityValueList || [];
      selectedProductStoreValues.value = JSON.parse(JSON.stringify(resp.data?.entityValueList || []));
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
  emitter.emit('dismissLoader');
}

function isSelected(productStoreId: any) {
  return selectedProductStoreValues.value.some((productStore: any) => productStore.productStoreId === productStoreId);
}

function toggleProductStoreSelection(store: any) {
  if (isSelected(store.productStoreId)) {
    selectedProductStoreValues.value = selectedProductStoreValues.value.filter((productStore: any) => productStore.productStoreId !== store.productStoreId);
  } else {
    selectedProductStoreValues.value.push(store);
  }
}

async function saveProductStores() {
  const productStoresToAdd = selectedProductStoreValues.value.filter((selectedStore: any) => !selectedProductStores.value.some((store: any) => store.productStoreId === selectedStore.productStoreId));
  const productStoresToRemove = selectedProductStores.value.filter((store: any) => !selectedProductStoreValues.value.some((selectedStore: any) => store.productStoreId === selectedStore.productStoreId));

  const removePromises = productStoresToRemove.map((store: any) =>
    facilityStore.updateProductStoreFacilityGroup({
      "productStoreId": store.productStoreId,
      "facilityGroupId": props.group.facilityGroupId,
      "fromDate": store.fromDate,
      "thruDate": DateTime.now().toMillis()
    })
  );

  const addPromises = productStoresToAdd.map((store: any) =>
    facilityStore.createProductStoreFacilityGroup({
      "productStoreId": store.productStoreId,
      "facilityGroupId": props.group.facilityGroupId,
      "fromDate": DateTime.now().toMillis()
    })
  );

  const responses = await Promise.allSettled([...removePromises, ...addPromises]);
  const hasFailed = responses.some((response: any) => response.status === 'rejected');
  
  if (hasFailed) {
    commonUtil.showToast(translate("Failed to associate some product stores to group."));
  } else {
    commonUtil.showToast(translate("Product stores associated to group successfully."));
  }
  fetchGroupsCount();
  modalController.dismiss();
}

async function fetchGroupsCount() {
  const productStoreCountByGroup = await facilityStore.fetchProductStoreCountByGroup([props.group.facilityGroupId]);
  const updatedGroups = JSON.parse(JSON.stringify(groups.value));
  const currentGroup = updatedGroups.find((g: any) => g.facilityGroupId === props.group.facilityGroupId);
  if (currentGroup) {
    currentGroup.productStoreCount = productStoreCountByGroup[props.group.facilityGroupId];
  }

  await facilityStore.updateFacilityGroups(updatedGroups);
}

function areProductStoresUpdated() {
  if (selectedProductStores.value.length !== selectedProductStoreValues.value.length) return true;

  return selectedProductStoreValues.value.some((selectedProductStore: any) => !selectedProductStores.value.find((productStore: any) => productStore.productStoreId === selectedProductStore.productStoreId));
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>