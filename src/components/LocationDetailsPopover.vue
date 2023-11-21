<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Location details") }}</ion-list-header>
      <ion-item button @click="addLocationModal">
        {{ translate("Edit location") }}
      </ion-item>
      <ion-item button lines="none" @click="removeLocation">
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
  modalController,
popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import AddLocationModal from "./AddLocationModal.vue";
import { useStore } from "vuex";

export default defineComponent({
  name: "LocationDetailsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  props: ["location"],
  methods: {
    async addLocationModal() {
      const addLocationModal = await modalController.create({
        component: AddLocationModal,
        componentProps: { location: this.location }
      })

      addLocationModal.present()

      addLocationModal.onDidDismiss().then((result: any) => {
        if(result.data?.result) {
          popoverController.dismiss();
        }
      })
    },
    async removeLocation() {
      await this.store.dispatch('facility/deleteFacilityLocation', this.location)
      popoverController.dismiss();
    }
  },
  setup() {
    const store = useStore();

    return {
      store,
      translate
    };
  }
});
</script>
