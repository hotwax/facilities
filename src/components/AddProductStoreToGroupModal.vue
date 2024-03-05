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
        <ion-label>
          {{ productStore.storeName }}
          <p>{{ productStore.productStoreId }}</p>
        </ion-label>
        <ion-checkbox :checked="isSelected(productStore.productStoreId)" slot="end" />
      </ion-item>
    </ion-list>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!areProductStoresUpdated()" @click="saveProductStores()">
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
import logger from "@/logger";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import { DateTime } from "luxon";

export default defineComponent({
  name: "AddProductStoreToGroupModal",
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
  props: ["group"],
  computed: {
    ...mapGetters({
      productStores: 'util/getProductStores',
      facilityProductStores: 'facility/getFacilityProductStores',
      groups: "facility/getFacilityGroups"
    })
  },
  data() {
    return {
      selectedProductStores: [],
      selectedProductStoreValues: [] as any
    }
  },
  async mounted() {
    await this.store.dispatch('util/fetchProductStores')
    this.fetchGroupProductStores()
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async fetchGroupProductStores() {
       try {
        const resp = await FacilityService.fetchAssociatedProductStoresToGroup({
          "inputFields": {
            "facilityGroupId": this.group.facilityGroupId
          },
          "viewSize": 250, // maximum view size
          "entityName": 'ProductStoreFacilityGroup',
          "noConditionFind": "Y",
          "filterByDate": 'Y'
        })

        if(!hasError(resp)) {
          this.selectedProductStores = resp.data.docs
          this.selectedProductStoreValues = JSON.parse(JSON.stringify(resp.data.docs))
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    isSelected(productStoreId: any) {
      return this.selectedProductStoreValues.some((productStore: any) => productStore.productStoreId === productStoreId);
    },
    toggleProductStoreSelection(updatedStore: any) {
      let selectedStore = this.selectedProductStoreValues.some((store: any) => store.productStoreId === updatedStore.productStoreId);

      if(selectedStore) {
        this.selectedProductStoreValues = this.selectedProductStoreValues.filter((store: any) => store.productStoreId !== updatedStore.productStoreId);
      } else {
        this.selectedProductStoreValues.push(updatedStore);
      }
    },
    async saveProductStores() {
      const productStoresToAdd = this.selectedProductStoreValues.filter((selectedStore: any) => !this.selectedProductStores.some((store: any) => store.productStoreId === selectedStore.productStoreId))
      const productStoresToRemove = this.selectedProductStores.filter((store: any) => !this.selectedProductStoreValues.some((selectedStore: any) => store.productStoreId === selectedStore.productStoreId))

      const removeResponses = await Promise.allSettled(productStoresToRemove
        .map(async (store: any) => await FacilityService.updateProductStoreFacilityGroup({
          "productStoreId": store.productStoreId,
          "facilityGroupId": this.group.facilityGroupId,
          "fromDate": store.fromDate,
          "thruDate": DateTime.now().toMillis()
        }))
      )

      const addResponses = await Promise.allSettled(productStoresToAdd
        .map(async (store: any) => await FacilityService.createProductStoreFacilityGroup({
          "productStoreId": store.productStoreId,
          "facilityGroupId": this.group.facilityGroupId,
          "fromDate": DateTime.now().toMillis()
        }))
      )

      const hasFailedResponse = [...removeResponses, ...addResponses].some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        showToast(translate("Failed to associate some product stores to group."))
      } else {
        showToast(translate("Product stores associated to group successfully."))
      }
      this.fetchGroupsCount()
      modalController.dismiss()
    },
    async fetchGroupsCount() {
      const productStoreCountByGroup = await FacilityService.fetchProductStoreCountByGroup([this.group.facilityGroupId])
      this.groups.map((group: any) => {
        if(group.facilityGroupId === this.group.facilityGroupId) {
          group.productStoreCount = productStoreCountByGroup[this.group.facilityGroupId]
        }
      })
      await this.store.dispatch('facility/updateFacilityGroups', this.groups)
    },
    areProductStoresUpdated() {
      return JSON.stringify(this.selectedProductStoreValues) !== JSON.stringify(this.selectedProductStores)
    }
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
    