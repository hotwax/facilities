<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate('Shopify location') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="type && type === 'update' ? updateMapping() : saveMapping()" @submit.prevent>
      <ion-list>
        <ion-list-header>{{ translate("Facility details") }}</ion-list-header>
        <ion-item>
          <ion-label>{{ translate("Facility ID") }}</ion-label>
          <ion-label slot="end">{{ currentFacility.facilityId }}</ion-label>
        </ion-item>
        <ion-item lines="none">
          <ion-label>{{ translate("Facility name") }}</ion-label>
          <ion-label slot="end">{{ currentFacility.facilityName }}</ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>{{ translate('Shopify location') }}</ion-list-header>
        <ion-item @keyup.enter.stop>
          <ion-label v-if="type && type === 'update'">{{ translate("Shopify store") }}</ion-label>
          <ion-label slot="end" v-if="type && type === 'update'">{{ shopifyFacilityMapping.shopId }}</ion-label>
          <ion-select v-else :label="translate('Shopify store')" interface="popover" :placeholder="translate('Select')" v-model="shopId">
            <ion-select-option v-for="shop in shopifyShops" :key="shop.shopId" :value="shop.shopId">
              {{ shop.name ? shop.name : shop.shopId }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-input id="inputElement" :label="translate('Location ID')" :placeholder="translate('Add your location ID from Shopify')" v-model="shopifyLocationId" />
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="type && type === 'update' ? updateMapping() : saveMapping()" @keyup.enter.stop>
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
  IonSelect,
  IonSelectOption,
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
import { ref, computed, onMounted } from "vue";

const props = defineProps(["shopifyFacilityMapping", "type"]);
const facilityStore = useFacilityStore();
const currentFacility = computed(() => facilityStore.getCurrent);

const shopId = ref('');
const shopifyLocationId = ref('');
const shopifyShops = ref([] as any);

onMounted(async () => {
  shopifyLocationId.value = props.shopifyFacilityMapping?.shopifyLocationId;
  await fetchShopifyShops();
  shopId.value = shopifyShops.value[0]?.shopId;
});

function closeModal() {
  modalController.dismiss();
}

async function saveMapping() {
  if (!shopId.value.trim() || !shopifyLocationId.value) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  emitter.emit('presentLoader');

  try {
    const resp = await facilityStore.createShopifyShopLocation({
      "facilityId": currentFacility.value.facilityId,
      "shopId": shopId.value,
      "shopifyLocationId": shopifyLocationId.value
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Shopify mapping created successfully'));
      facilityStore.fetchShopifyFacilityMappings({ facilityId: currentFacility.value.facilityId });
      closeModal();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to create shopify mapping'));
    logger.error('Failed to create shopify mapping', err);
  }

  emitter.emit('dismissLoader');
}

async function updateMapping() {
  if (!shopifyLocationId.value) {
    commonUtil.showToast(translate('Please fill all the required fields'));
    return;
  }

  emitter.emit('presentLoader');

  try {
    const resp = await facilityStore.updateShopifyShopLocation({
      "facilityId": currentFacility.value.facilityId,
      "shopId": props.shopifyFacilityMapping.shopId,
      "shopifyLocationId": shopifyLocationId.value
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Shopify mapping updated successfully'));
      facilityStore.fetchShopifyFacilityMappings({ facilityId: currentFacility.value.facilityId });
      closeModal();
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update shopify mapping'));
    logger.error('Failed to update shopify mapping', err);
  }

  emitter.emit('dismissLoader');
}

async function fetchShopifyShops() {
  const utilStore = useUtilStore();
  try {
    const resp = await utilStore.fetchShopifyShops({
      entityName: "ShopifyShop",
      fieldList: ['shopId', 'name'],
      noConditionFind: 'Y',
      viewSize: 100
    });

    shopifyShops.value = resp.docs;
  } catch (error) {
    commonUtil.showToast(translate('Failed to fetch shopify shops.'));
    logger.error('Failed to fetch shopify shops.', error);
  }
}
</script>