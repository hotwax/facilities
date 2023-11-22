<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Choose system") }}</ion-list-header>
      <ion-item @click="createShopifyShopLocationModal" button>
        {{ translate('Shopify') }}
      </ion-item>
      <ion-item v-for="(desc, type) in externalMappingTypes" :key="type" @click="addMappingModal(type)" button>
        {{ desc }}
      </ion-item>
      <ion-item button lines="none" @click="openCustomMappingModal">
        {{ translate("Custom") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  modalController,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import CustomMappingModal from "./CustomMappingModal.vue";
import FacilityMappingModal from "./FacilityMappingModal.vue";
import { mapGetters } from "vuex";
import FacilityShopifyLocationModal from "./FacilityShopifyLocationModal.vue";

export default defineComponent({
  name: "AddExternalMappingPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      externalMappingTypes: 'util/getExternalMappingTypes'
    })
  },
  methods: {
    async openCustomMappingModal() {
      const customMappingModal = await modalController.create({
        component: CustomMappingModal
      })
  
      customMappingModal.present()

      customMappingModal.onDidDismiss().then(() => {
        popoverController.dismiss();
      })
    },
    async addMappingModal(type: any) {
      const addMappingModal = await modalController.create({
        component: FacilityMappingModal,
        componentProps: { mappingType: type }
      })
  
      addMappingModal.present()

      addMappingModal.onDidDismiss().then(() => {
        popoverController.dismiss();
      })
    },
    async createShopifyShopLocationModal() {
      const shopifyShopLocationModal = await modalController.create({
        component: FacilityShopifyLocationModal
      })
  
      shopifyShopLocationModal.present()

      shopifyShopLocationModal.onDidDismiss().then(() => {
        popoverController.dismiss();
      })
    }
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
