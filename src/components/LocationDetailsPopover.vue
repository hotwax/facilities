<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Location details") }}</ion-list-header>
      <ion-item button @click="addLocationModal">
        {{ translate("Edit location") }}
      </ion-item>
      <ion-item button lines="none">
        {{ translate("Remove location") }}
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
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import AddLocationModal from "./AddLocationModal.vue";

export default defineComponent({
  name: "LocationDetailsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  methods: {
    async addLocationModal() {
      const addLocationModal = await modalController.create({
        component: AddLocationModal
      })

      addLocationModal.present()
    }
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
