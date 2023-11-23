<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getStoreDetail(currentProductStore.productStoreId).storeName }}</ion-list-header>
      <ion-item button :disabled="currentProductStore.productStoreId === primaryMember.facilityGroupId" @click="makePrimary()">
        {{ translate("Make primary") }}
        <ion-icon slot="end" :icon="starOutline" />
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
import { starOutline, removeCircleOutline } from "ionicons/icons";
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
      productStores: 'util/getProductStores'
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
    getStoreDetail(productStoreId: any) {
      return this.productStores.find((store: any) => store.productStoreId === productStoreId)
    },
    async makePrimary() {
      let resp;
      let facilityGroupId;
      const productStoreId = this.currentProductStore.productStoreId

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
            showToast(translate("Product Store made primary successfully."))

            // Remove old primary store
            if(this.primaryMember.facilityGroupId) {
              await this.removeProductFromPrimaryMember()
            }
          } else {
            throw resp.data
          }
        } catch(err) {
          showToast(translate("Failed to make store primary."))
          logger.error(err)
        }
      } else {
        showToast(translate("Failed to make store primary."))
      }
      popoverController.dismiss()
    },
    async fetchFacilityGroup(productStoreId: any) {
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
          facilityGroupName: this.getStoreDetail(productStoreId).storeName,
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
      starOutline,
      store,
      translate
    };
  }
});
</script>
