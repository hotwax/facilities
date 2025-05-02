<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Choose system") }}</ion-list-header>
      <ion-item @click="createShopifyFacilityMappingModal" button>
        {{ translate('Shopify') }}
      </ion-item>
      <ion-item @click="createFacilityExternalId" button>
        {{ translate('External ID') }}
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
import FacilityShopifyMappingModal from "./FacilityShopifyMappingModal.vue";
import FacilityExternalIdModal from './FacilityExternalIdModal.vue';

export default defineComponent({
  name: "FacilityMappingPopover",
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

      await popoverController.dismiss()
      customMappingModal.present().then(() => {
        (document.querySelector("#inputElement") as any).setFocus()
      })
    },
    async addMappingModal(type: any) {
      const addMappingModal = await modalController.create({
        component: FacilityMappingModal,
        componentProps: { mappingId: type }
      })
  
      await popoverController.dismiss()
      addMappingModal.present().then(() => {
        (document.querySelector("#inputElement") as any).setFocus()
      })
    },
    async createShopifyFacilityMappingModal() {
      const facilityShopifyMappingModal = await modalController.create({
        component: FacilityShopifyMappingModal
      })
  
      await popoverController.dismiss()
      facilityShopifyMappingModal.present().then(() => {
        (document.querySelector("#inputElement") as any).setFocus()
      })
    },
    async createFacilityExternalId() {
      const facilityExternalIdModal = await modalController.create({
        component: FacilityExternalIdModal
      })

      await popoverController.dismiss()
      facilityExternalIdModal.present().then(() => {
        (document.querySelector("#inputElement") as any).setFocus()
      })
    },
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
