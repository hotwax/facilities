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
import { mapGetters, useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";

export default defineComponent({
  name: "LocationDetailsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent'
    })
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
      const params = {
        facilityId: this.location.facilityId,
        locationSeqId: this.location.locationSeqId
      }

      try {
        const resp = await FacilityService.deleteFacilityLocation(params)

        if(!hasError(resp)) {
          this.store.dispatch('facility/fetchFacilityLocation')
          popoverController.dismiss();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to remove facility location'))
        logger.error('Failed to remove facility location', err)
      }
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
