<template>
  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ getProductStore(currentProductStore.productStoreId).storeName || currentProductStore.productStoreId }}
      </ion-list-header>
      <ion-item button @click="togglePrimary()">
        {{ translate("Primary") }}
        <ion-icon slot="end" :color="current.primaryFacilityGroupId === shopifyShopIdForProductStore(currentProductStore.productStoreId) ? 'warning' : ''" :icon="current.primaryFacilityGroupId === shopifyShopIdForProductStore(currentProductStore.productStoreId) ? star : starOutline" />
      </ion-item>
      <ion-item button lines="none" @click="removeStoreFromFacility()">
        {{ translate("Unlink") }}
        <ion-icon slot="end" :icon="removeCircleOutline" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  popoverController
} from "@ionic/vue";
import { removeCircleOutline, star, starOutline } from "ionicons/icons";
import { translate } from "@common";
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { commonUtil } from "@common";
import logger from "@/logger";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { computed } from "vue";

const props = defineProps(['currentProductStore', 'facilityId']);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const current = computed(() => facilityStore.getCurrent);
const getProductStore = computed(() => (id: string) => utilStore.getProductStore(id));
const shopifyShopIdForProductStore = computed(() => (id: string) => utilStore.getShopifyShopIdForProductStore(id));

async function removeStoreFromFacility() {
  emitter.emit('presentLoader');

  try {
    const resp = await FacilityService.updateProductStoreFacility({
      facilityId: props.facilityId,
      productStoreId: props.currentProductStore.productStoreId,
      fromDate: props.currentProductStore.fromDate,
      thruDate: DateTime.now().toMillis()
    });

    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Store unlinked successfully.'));

      // TODO: need to check if we need to remove primary value from the facility if product store is removed.
      // Removing primaryFacilityGroupId from the facility, if present
      if (shopifyShopIdForProductStore.value(props.currentProductStore.productStoreId) === current.value.primaryFacilityGroupId) {
        const updateResp = await FacilityService.updateFacility({
          facilityId: props.facilityId,
          primaryFacilityGroupId: ''
        });
        if (!commonUtil.hasError(updateResp)) {
          await facilityStore.updateCurrentFacility({ ...current.value, primaryFacilityGroupId: '' });
        } else {
          throw updateResp.data;
        }
      }
      // refetching product stores with updated roles
      await facilityStore.getFacilityProductStores({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
    commonUtil.showToast(translate('Store unlink failed.'));
  }
  popoverController.dismiss();
  emitter.emit('dismissLoader');
}

async function updatePrimaryStore(shopifyShopId = '') {
  try {
    const resp = await FacilityService.updateFacility({
      facilityId: props.facilityId,
      primaryFacilityGroupId: shopifyShopId
    });
    if (!commonUtil.hasError(resp)) {
      await facilityStore.updateCurrentFacility({ ...current.value, primaryFacilityGroupId: shopifyShopId });
    } else {
      throw resp.data;
    }
  } catch (error) {
    commonUtil.showToast(translate('Failed to update primary product store'));
    logger.error('Failed to update primary product store', error);
  }
}

async function togglePrimary() {
  emitter.emit('presentLoader');

  const productStoreId = props.currentProductStore.productStoreId;
  let shopifyShopId = shopifyShopIdForProductStore.value(productStoreId);

  // if the shopifyShop is not present for productStore inside the facility then fetching the shopify information for productStore
  if (!shopifyShopId) {
    shopifyShopId = await utilStore.fetchShopifyShopForProductStores([productStoreId]);
  }

  // if we does not get shopify shop id for the store then not making product store as primary
  if (!shopifyShopId) {
    commonUtil.showToast(translate('Failed to make product store primary due to missing Shopify shop'));
    popoverController.dismiss();
    emitter.emit('dismissLoader');
    return;
  }

  // when product store is already primary
  if (current.value.primaryFacilityGroupId === shopifyShopId) {
    await updatePrimaryStore();
    popoverController.dismiss();
    emitter.emit('dismissLoader');
    return;
  }

  // creating for facility group, as group is required when updating primaryFacilityGroupId on facility

  let facilityGroupId;

  // Fetching the facility group corresponding to the shopifyShopId.
  // There should be one facility group where facilityGroupId equals to shopifyShopId in order
  // to manage primary product store of a facility.
  facilityGroupId = await fetchFacilityGroup(shopifyShopId);

  // Create one facility group corresponding to the shopifyShopId if not exists.
  if (!facilityGroupId) {
    facilityGroupId = await createFacilityGroup(shopifyShopId);
  }

  // if facilityGroup is still not found, then not update primary store for facility
  if (facilityGroupId) {
    await updatePrimaryStore(shopifyShopId);
  } else {
    commonUtil.showToast(translate('Failed to make product store primary due to missing group'));
  }
  popoverController.dismiss();
  emitter.emit('dismissLoader');
}

async function fetchFacilityGroup(shopifyShopId: string) {
  let facilityGroupId;
  try {
    const resp = await FacilityService.fetchFacilityGroup({
      inputFields: {
        facilityGroupId: shopifyShopId
      },
      entityName: 'FacilityGroup',
      fieldList: ['facilityGroupId', 'facilityGroupTypeId'],
      viewSize: 1
    });

    if (!commonUtil.hasError(resp)) {
      facilityGroupId = resp.data.docs[0].facilityGroupId;
    } else {
      throw resp.data;
    }
  } catch (error) {
    logger.error('Failed to fetch facility group', error);
  }
  return facilityGroupId;
}

async function createFacilityGroup(shopifyShopId: string) {
  let facilityGroupId;
  try {
    const resp = await FacilityService.createFacilityGroup({
      facilityGroupId: shopifyShopId,
      facilityGroupName: getProductStore.value(props.currentProductStore.productStoreId).storeName,
      facilityGroupTypeId: 'FEATURING'
    });

    if (!commonUtil.hasError(resp)) {
      facilityGroupId = resp.data.facilityGroupId;
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
  return facilityGroupId;
}
</script>