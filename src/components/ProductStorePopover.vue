<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getProductStore(currentProductStore.productStoreId).storeName }}</ion-list-header>
      <ion-item button @click="makePrimary()">
        {{ translate("Primary") }}
        <ion-icon slot="end"  :color="primaryMember.facilityGroupId === currentProductStore.productStoreId ? 'warning' : ''" :icon="primaryMember.facilityGroupId === currentProductStore.productStoreId ? star : starOutline" />
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
  props: ['currentProductStore', 'facilityId', 'primaryMember'],
  computed: {
    ...mapGetters({
      facilityProductStores: 'facility/getFacilityProductStores',
      getProductStore: 'util/getProductStore',
      productStores: 'util/getProductStores'
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

          // Removing store from primary Member group if primary.
          if(this.currentProductStore.productStoreId === this.primaryMember.facilityGroupId){
            await this.revokePrimaryStatusFromStore()
          }

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
    async makePrimary() {
      const productStoreId = this.currentProductStore.productStoreId
      if(this.primaryMember.facilityGroupId === productStoreId) {
        this.revokePrimaryStatusFromStore()
        popoverController.dismiss()
        return;
      }

      let resp;
      let facilityGroupId;
      emitter.emit('presentLoader')

      // Fetching the facility group corresponding to the selected product store.
      // There should be one facility group where facilityGroupId equals to productStoreId in order
      // to manage primary product store of a facility.
      facilityGroupId = await this.fetchFacilityGroup(productStoreId)

      // Create one facility group corresponding to the selected product store if not exists.
      if(!facilityGroupId) {
        facilityGroupId = await this.createFacilityGroup(productStoreId)
      } 

      if(facilityGroupId) {
        try {
          resp = await FacilityService.addFacilityToGroup({
            facilityId: this.facilityId,
            facilityGroupId: facilityGroupId
          })

          if(!hasError(resp)) {
            // Remove old primary store
            if(this.primaryMember.facilityGroupId) {
              await this.revokePrimaryStatusFromStore()
            }
          } else {
            throw resp.data
          }
        } catch(err) {
          showToast(translate("Failed to make product store primary."))
          logger.error(err)
        }
      } else {
        showToast(translate("Failed to make product store primary."))
      }
      popoverController.dismiss()
      emitter.emit('dismissLoader')
    },
    async fetchFacilityGroup(productStoreId: string) {
      let facilityGroupId;
      let resp;
      try {
        resp = await FacilityService.fetchFacilityGroup({
          inputFields: {
            facilityGroupId: productStoreId
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
      } catch(err) {
        logger.error(err)
      }
      return facilityGroupId
    },
    async createFacilityGroup(productStoreId: string) {
      let facilityGroupId;
      try {
        const resp = await FacilityService.createFacilityGroup({
          facilityGroupId: productStoreId,
          facilityGroupName: this.getProductStore(productStoreId).storeName,
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
    },
    async revokePrimaryStatusFromStore() {
      let resp;
      emitter.emit('presentLoader')
      try {
        resp = await FacilityService.updateFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": this.primaryMember.facilityGroupId,
          "fromDate": this.primaryMember.fromDate,
          "thruDate": DateTime.now().toMillis()
        })

        if(hasError(resp)) {
          throw resp.data
        }
      } catch (err) {
        logger.error(err)
      }
      emitter.emit('dismissLoader')
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