<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Choose system") }}</ion-list-header>
      <ion-item button>
        {{ translate("Shopify") }}
      </ion-item>
      <ion-item button>
        {{ translate("Netsuite") }}
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
  IonList,
  IonListHeader,
  IonItem,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import CustomMappingModal from "./CustomMappingModal.vue";

export default defineComponent({
  name: "ExternalSystemPopover",
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonItem
  },
  methods: {
    async openCustomMappingModal() {
      const customMappingModal = await modalController.create({
        component: CustomMappingModal
      })
  
      customMappingModal.present()
    }
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
