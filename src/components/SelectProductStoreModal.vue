<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select product stores") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-item v-for="productStore in productStores" :key="productStore.productStoreId">
        <ion-label>
          {{ productStore.storeName }}
          <p>{{ productStore.productStoreId }}</p>
        </ion-label>
        <ion-checkbox slot="end" :checked="isSelected(productStore.productStoreId)" @ionChange="toggleProductStoreSelection(productStore)" />
      </ion-item>
    </ion-list>

    <ion-fab @click="saveProductStores()" vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button>
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
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
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { showToast } from "@/utils";

export default defineComponent({
  name: "SelectProductStoreModal",
  components: { 
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
    IonToolbar
  },
  computed: {
    ...mapGetters({
      productStores: 'util/getProductStores',
      facilityProductStores: 'facility/getFacilityProductStores',
    })
  },
  props: ["facilityId", "selectedProductStores", "primaryMember"],
  data() {
    return {
      selectedProductStoreValues: JSON.parse(JSON.stringify(this.selectedProductStores)),
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async saveProductStores() {
      const productStoresToCreate = this.selectedProductStoreValues.filter((selectedFacility: any) => !this.selectedProductStores.some((facility: any) => facility.facilityId === selectedFacility.facilityId))
      const productStoresToRemove = this.selectedProductStores.filter((facility: any) => !this.selectedProductStoreValues.some((selectedFacility: any) => facility.facilityId === selectedFacility.facilityId))

      const updateResponses = await Promise.allSettled(productStoresToRemove
        .map(async (payload: any) => await FacilityService.updateProductStoreFacility({
          facilityId: this.facilityId,
          fromDate: this.facilityProductStores.find((store: any) => payload.productStoreId === store.productStoreId).fromDate,
          productStoreId: payload.productStoreId,
          thruDate: DateTime.now().toMillis()
        }))
      )

      const createResponses = await Promise.allSettled(productStoresToCreate
        .map(async (payload: any) => await FacilityService.createProductStoreFacility({
          productStoreId: payload.productStoreId,
          facilityId: this.facilityId,
          fromDate: DateTime.now().toMillis(),
        }))
      )
          
      const hasFailedResponse = [...updateResponses, ...createResponses].some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        showToast(translate('Failed to update some facility stores'))
      } else {
        showToast(translate('Facility stores updated successfully.'))
      }

      // refetching product stores with updated roles
      await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
      modalController.dismiss()
    },
    toggleProductStoreSelection(updatedStore: any) {
      let selectedStore = this.selectedProductStoreValues.some((store: any) => store.productStoreId === updatedStore.productStoreId);
      if(selectedStore) {
        this.selectedProductStoreValues = this.selectedProductStoreValues.filter((store: any) => store.productStoreId !== updatedStore.productStoreId);
      } else {
        this.selectedProductStoreValues.push(updatedStore);
      }
    },
    isSelected(productStoreId: any) {
      return this.selectedProductStoreValues.some((productStore: any) => productStore.productStoreId === productStoreId);
    },
    // async removeProductFromPrimaryMember() {
    //   let resp;
    //   try {
    //     resp = await FacilityService.updateFacilityToGroup({
    //       "facilityId": this.facilityId,
    //       "facilityGroupId": facilityGroupId,
    //       "fromDate": groupInformation.fromDate,
    //       "thruDate": DateTime.now().toMillis()
    //     })

    //     if (!hasError(resp)) {
    //       showToast(translate('Fulfillment setting updated successfully'))
    //     } else {
    //       throw resp.data
    //     }
    //   } catch (err) {
    //     showToast(translate('Failed to update fulfillment setting'))
    //     logger.error('Failed to update fulfillment setting', err)
    //   }
    // }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>
    