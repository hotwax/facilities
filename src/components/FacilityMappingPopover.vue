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

<script setup lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  modalController,
  popoverController
} from "@ionic/vue";
import { translate } from "@hotwax/dxp-components";
import CustomMappingModal from "./CustomMappingModal.vue";
import FacilityMappingModal from "./FacilityMappingModal.vue";
import FacilityShopifyMappingModal from "./FacilityShopifyMappingModal.vue";
import FacilityExternalIdModal from './FacilityExternalIdModal.vue';
import { useUtilStore } from "@/store/util";
import { computed } from "vue";

const utilStore = useUtilStore();
const externalMappingTypes = computed(() => utilStore.getExternalMappingTypes);

async function openCustomMappingModal() {
  const customMappingModal = await modalController.create({
    component: CustomMappingModal
  });

  await popoverController.dismiss();
  await customMappingModal.present();
  setTimeout(() => {
    (document.querySelector("#inputElement") as any)?.setFocus();
  }, 100);
}

async function addMappingModal(type: any) {
  const addMappingModal = await modalController.create({
    component: FacilityMappingModal,
    componentProps: { mappingId: type }
  });

  await popoverController.dismiss();
  await addMappingModal.present();
  setTimeout(() => {
    (document.querySelector("#inputElement") as any)?.setFocus();
  }, 100);
}

async function createShopifyFacilityMappingModal() {
  const facilityShopifyMappingModal = await modalController.create({
    component: FacilityShopifyMappingModal
  });

  await popoverController.dismiss();
  await facilityShopifyMappingModal.present();
  setTimeout(() => {
    (document.querySelector("#inputElement") as any)?.setFocus();
  }, 100);
}

async function createFacilityExternalId() {
  const facilityExternalIdModal = await modalController.create({
    component: FacilityExternalIdModal
  });

  await popoverController.dismiss();
  await facilityExternalIdModal.present();
  setTimeout(() => {
    (document.querySelector("#inputElement") as any)?.setFocus();
  }, 100);
}
</script>
