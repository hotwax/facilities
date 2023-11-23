<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getProductStore(currentProductStore.productStoreId).storeName }}</ion-list-header>
      <ion-item button @click="makePrimary()">
        {{ translate("Primary") }}
        <ion-icon slot="end" :icon="primaryMember.facilityGroupId === currentProductStore.productStoreId ? star : starOutline" />
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
  IonList,
  IonListHeader,
  IonIcon,
  IonItem,
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

export default defineComponent({
  name: "ProductStorePopover",
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonIcon,
    IonItem
  },
  props: ['currentProductStore', 'facilityId', 'primaryMember'],
  computed: {
    ...mapGetters({
      facilityProductStores: 'facility/getFacilityProductStores',
      productStores: 'util/getProductStores',
      getProductStore: 'util/getProductStore'
    })
  },
  methods: {
    async removeStoreFromFacility() {
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
            await this.removeProductFromPrimaryMember()
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
    },
    async makePrimary() {
      const productStoreId = this.currentProductStore.productStoreId
      if(this.primaryMember.facilityGroupId === productStoreId) {
        this.removeProductFromPrimaryMember()
        popoverController.dismiss()
        return;
      }

      let resp;
      let facilityGroupId;

      facilityGroupId = await this.fetchFacilityGroup(productStoreId)

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
              await this.removeProductFromPrimaryMember()
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
          viewSize: 100
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
          facilityGroupTypeId: 'FEATURING',
          facilityGroupName: this.getProductStore(productStoreId).storeName,
          facilityGroupId: productStoreId
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
    async removeProductFromPrimaryMember() {
      let resp;
      try {
        resp = await FacilityService.updateFacilityToGroup({
          "facilityId": this.facilityId,
          "facilityGroupId": this.primaryMember.facilityGroupId,
          "fromDate": this.primaryMember.fromDate,
          "thruDate": DateTime.now().toMillis()
        })
      } catch (err) {
        logger.error(err)
      }
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
