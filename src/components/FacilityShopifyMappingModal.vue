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
    <form @keyup.enter="saveMapping">
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
        <ion-item>
          <ion-label>{{ translate("Shopify store") }}</ion-label>
          <ion-label slot="end" v-if="type && type === 'update'">{{ shopifyFacilityMapping.shopId }}</ion-label>
          <!-- TODO: change field to select -->
          <ion-input slot="end" v-else v-model="shopId" />
        </ion-item>
        <ion-item>
          <ion-label>{{ translate("Location ID") }}</ion-label>
          <ion-input slot="end" :placeholder="translate('add your location ID from Shopify')" v-model="shopifyLocationId" />
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="type && type === 'update' ? updateMapping : saveMapping" @keyup.enter.stop>
          <ion-icon :icon="saveOutline" />
        </ion-fab-button>
      </ion-fab>
    </form>
  </ion-content>
</template>

<script lang="ts">
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
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from 'vuex'
import { FacilityService } from '@/services/FacilityService'
import { showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from "@/logger";

export default defineComponent({
  name: "FacilityShopifyMappingModal",
  components: {
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
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      currentFacility: 'facility/getCurrent'
    })
  },
  data() {
    return {
      shopId: '',
      shopifyLocationId: ''
    }
  },
  props: ["shopifyFacilityMapping", "type"],
  mounted() {
    this.shopifyLocationId = this.shopifyFacilityMapping?.shopifyLocationId
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveMapping() {
      if(!this.shopId.trim() || !this.shopifyLocationId) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      let resp;

      try {
        resp = await FacilityService.createShopifyShopLocation({
          "facilityId": this.currentFacility.facilityId,
          "shopId": this.shopId,
          "shopifyLocationId": this.shopifyLocationId
        })

        if(!hasError(resp)) {
          showToast(translate('Shopify mapping created successfully'))
          this.store.dispatch('facility/fetchShopifyFacilityMappings', { facilityId: this.currentFacility.facilityId })
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create shopify mapping'))
        logger.error('Failed to create shopify mapping', err)
      }
    },
    async updateMapping() {
      if(!this.shopifyLocationId) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      let resp;

      try {
        resp = await FacilityService.updateShopifyShopLocation({
          "facilityId": this.currentFacility.facilityId,
          "shopId": this.shopifyFacilityMapping.shopId,
          "shopifyLocationId": this.shopifyLocationId
        })

        if(!hasError(resp)) {
          showToast(translate('Shopify mapping updated successfully'))
          this.store.dispatch('facility/fetchShopifyFacilityMappings', { facilityId: this.currentFacility.facilityId })
          // TODO: overlay does not exist error, fix this
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update shopify mapping'))
        logger.error('Failed to update shopify mapping', err)
      }
    }
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>