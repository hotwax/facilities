<template>
  <ion-content>
    <ion-list>
      <ion-item button :disabled="!isRegenerationRequired" @click="regenerateLatitudeAndLongitude">
        {{ translate("Regenerate") }}
      </ion-item>
      <ion-item button lines="none" @click="removeLatitudeAndLongitude">
        {{ translate("Remove") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonItem,
  IonList,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import { UtilService } from '@/services/UtilService';

export default defineComponent({
  name: "LocationDetailsPopover",
  components: {
    IonContent,
    IonItem,
    IonList
  },
  computed: {
    ...mapGetters({
      postalAddress: 'facility/getPostalAddress',
    })
  },
  props: ['facilityId', 'isRegenerationRequired'],
  methods: {
    async regenerateLatitudeAndLongitude() {
      let resp;

      try {
        resp = await UtilService.generateLatLong({
          json: {
            params: {
              q: `postcode: ${this.postalAddress.postalCode}`
            }
          }
        })

        if(!hasError(resp)) {
          const generatedLatLong = resp.data.response.docs[0]
          if(generatedLatLong.latitude && generatedLatLong.longitude) {
            resp = await FacilityService.updateFacilityPostalAddress({
              ...this.postalAddress,
              facilityId: this.facilityId,
              latitude: generatedLatLong.latitude,
              longitude: generatedLatLong.longitude
            })

            if(!hasError(resp)) {
              showToast(translate("Successfully regenerated latitude and longitude for the facility."))
              await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
              popoverController.dismiss()
            } else {
              throw resp.data
            }
          }
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to regenerate latitude and longitude for the facility."))
        logger.error(err);
      }
    },
    async removeLatitudeAndLongitude() {
      let resp;

      try {
        resp = await FacilityService.updateFacilityPostalAddress({...this.postalAddress, facilityId: this.facilityId, latitude: '', longitude: ''})

        if(!hasError(resp)) {
          showToast(translate("Facility latitude & longitude removed successfully."))
          await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
          popoverController.dismiss()
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to remove facility latitude & longitude."))
        logger.error(err)
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
