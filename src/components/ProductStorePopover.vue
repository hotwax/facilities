<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getProductStore(currentProductStore.productStoreId).storeName }}</ion-list-header>
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

<script lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { removeCircleOutline, star, starOutline } from "ionicons/icons";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import emitter from "@/event-bus";

export default defineComponent({
  name: "ProductStorePopover",
  components: {
    IonContent,
    IonIcon,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ['currentProductStore', 'facilityId'],
  computed: {
    ...mapGetters({
      facilityProductStores: 'facility/getFacilityProductStores',
      getProductStore: 'util/getProductStore',
      productStores: 'util/getProductStores',
      shopifyShopIdForProductStore: 'util/getShopifyShopIdForProductStore',
      current: 'facility/getCurrent'
    })
  },
  methods: {
    async removeStoreFromFacility() {
      emitter.emit('presentLoader')

      try {
        const resp = await FacilityService.updateProductStoreFacility({
          facilityId: this.facilityId,
          productStoreId: this.currentProductStore.productStoreId,
          fromDate: this.currentProductStore.fromDate,
          thruDate: DateTime.now().toMillis()
        })

        if(!hasError(resp)) {
          showToast(translate('Store unlinked successfully.'))

          // TODO: need to check if we need to remove primary value from the facility if product store is removed.
          // Removing primaryFacilityGroupId from the facility, if present
          if(this.shopifyShopIdForProductStore(this.currentProductStore.productStoreId) === this.current.primaryFacilityGroupId) {
            await FacilityService.updateFacility({
              facilityId: this.facilityId,
              primaryFacilityGroupId: ''
            })
          }
          await this.store.dispatch('facility/updateCurrentFacility', { ...this.current, primaryFacilityGroupId: '' })
          // refetching product stores with updated roles
          await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
        showToast(translate('Store unlink failed.'))
      }
      popoverController.dismiss()
      emitter.emit('dismissLoader')
    },
    async updatePrimaryStore(shopifyShopId = '') {
      try {
        const resp = await FacilityService.updateFacility({
          facilityId: this.facilityId,
          primaryFacilityGroupId: shopifyShopId
        })
        if(!hasError(resp)) {
          await this.store.dispatch('facility/updateCurrentFacility', { ...this.current, primaryFacilityGroupId: shopifyShopId })
        } else {
          throw resp.data
        }
      } catch(error) {
        showToast(translate('Failed to update primary product store'))
        logger.error('Failed to update primary product store', error)
      }
    },
    async togglePrimary() {
      emitter.emit('presentLoader')

      const productStoreId = this.currentProductStore.productStoreId
      let shopifyShopId = this.shopifyShopIdForProductStore(productStoreId)

      // if the shopifyShop is not present for productStore inside the facility then fetching the shopify information for productStore
      if(!shopifyShopId) {
        shopifyShopId = await this.store.dispatch('util/fetchShopifyShopForProductStores', [productStoreId])
      }

      // if we does not get shopify shop id for the store then not making product store as primary
      if(!shopifyShopId) {
        showToast(translate('Failed to make product store primary due to missing Shopify shop'))
        popoverController.dismiss()
        emitter.emit('dismissLoader')
        return;
      }

      // when product store is already primary
      if(this.current.primaryFacilityGroupId === shopifyShopId) {
        await this.updatePrimaryStore();
        popoverController.dismiss()
        emitter.emit('dismissLoader')
        return;
      }

      // creating for facility group, as group is required when updating primaryFacilityGroupId on facility

      let facilityGroupId;

      // Fetching the facility group corresponding to the shopifyShopId.
      // There should be one facility group where facilityGroupId equals to shopifyShopId in order
      // to manage primary product store of a facility.
      facilityGroupId = await this.fetchFacilityGroup(shopifyShopId)

      // Create one facility group corresponding to the shopifyShopId if not exists.
      if(!facilityGroupId) {
        facilityGroupId = await this.createFacilityGroup(shopifyShopId)
      }

      // if facilityGroup is still not found, then not update primary store for facility
      if(facilityGroupId) {
        await this.updatePrimaryStore(shopifyShopId);
      } else {
        showToast(translate('Failed to make product store primary due to missing group'))
      }
      popoverController.dismiss()
      emitter.emit('dismissLoader')
    },
    async fetchFacilityGroup(shopifyShopId: string) {
      let facilityGroupId;
      try {
        const resp = await FacilityService.fetchFacilityGroup({
          inputFields: {
            facilityGroupId: shopifyShopId
          },
          entityName: 'FacilityGroup',
          fieldList: ['facilityGroupId', 'facilityGroupTypeId'],
          viewSize: 1
        })

        if(!hasError(resp)) {
          facilityGroupId = resp.data.docs[0].facilityGroupId
        } else {
          throw resp.data
        }
      } catch(error) {
        logger.error('Failed to fetch facility group', error)
      }
      return facilityGroupId
    },
    async createFacilityGroup(shopifyShopId: string) {
      let facilityGroupId;
      try {
        const resp = await FacilityService.createFacilityGroup({
          facilityGroupId: shopifyShopId,
          facilityGroupName: this.getProductStore(this.currentProductStore.productStoreId).storeName,
          facilityGroupTypeId: 'FEATURING'
        })
  
        if(!hasError(resp)) {
          facilityGroupId = resp.data.facilityGroupId
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
      return facilityGroupId
    }
  },
  setup() {
    const store = useStore();

    return {
      removeCircleOutline,
      star,
      starOutline,
      store,
      translate
    };
  }
});
</script>