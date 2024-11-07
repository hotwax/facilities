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
import emitter from "@/event-bus";

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
      let resp, generatedLatLong;

      emitter.emit('presentLoader')

      try {
        const postalCode = this.postalAddress.postalCode;
        const query = postalCode.startsWith('0') ? `${postalCode} OR ${postalCode.substring(1)}` : postalCode;

        resp = await UtilService.generateLatLong({
          json: {
            params: {
              q: `postcode: ${query}`
            }
          }
        })

        if(!hasError(resp) && resp.data.response.docs.length > 0) {
          generatedLatLong = resp.data.response.docs[0]

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

      popoverController.dismiss({ generatedLatLong })
      emitter.emit('dismissLoader')
    },
    async removeLatitudeAndLongitude() {
      emitter.emit('presentLoader')

      let resp;

      try {
        resp = await FacilityService.updateFacilityPostalAddress({
          ...this.postalAddress,
          facilityId: this.facilityId,
          latitude: '',
          longitude: ''
        })

        if(!hasError(resp)) {
          showToast(translate("Facility latitude and longitude removed successfully."))
          await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to remove facility latitude and longitude."))
        logger.error(err)
      }

      popoverController.dismiss()
      emitter.emit('dismissLoader')
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
