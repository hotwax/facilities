<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Latitude & Longitude") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="saveGeoPoint">
      <ion-item class="ion-margin-bottom">
        <ion-input :placeholder="translate('Zipcode')" v-model="geoPoint.postalCode" />
        <ion-button fill="outline" @click="generateLatLong">
          {{ translate("Generate") }}
          <ion-icon slot="end" :icon="colorWandOutline" />
        </ion-button>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Latitude") }}</ion-label>
        <ion-input v-model="geoPoint.latitude" />
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Longitude") }}</ion-label>
        <ion-input v-model="geoPoint.longitude" />
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveGeoPoint">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
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
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { closeOutline, colorWandOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { showToast } from "@/utils";
import { hasError } from "@/adapter";
import { UtilService } from "@/services/UtilService";
import logger from "@/logger";
import { FacilityService } from '@/services/FacilityService'
  
export default defineComponent({
  name: "FacilityGeoPointModal",
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
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      postalAddress: 'facility/getPostalAddress',
    })
  },
  props: ['facilityId'],
  data() {
    return {
      geoPoint: {} as any
    }
  },
  beforeMount() {
    this.geoPoint = JSON.parse(JSON.stringify(this.postalAddress))
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async generateLatLong() {
      const payload = {
        json: {
          params: {
            q: `postcode: ${this.geoPoint.postalCode}`
          }
        }
      }

      try {
        const resp = await UtilService.generateLatLong(payload)

        if(!hasError(resp)) {
          const result = resp.data.response.docs[0]
          this.geoPoint.latitude = result.latitude
          this.geoPoint.longitude = result.longitude
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to generate latitude and Longitude."))
        logger.error(err)
      }
    },
    async saveGeoPoint() {
      if(!this.geoPoint.latitude || !this.geoPoint.longitude) {
        showToast("Please fill all the required fields")
        return;
      }

      let resp;

      try {
        resp = await FacilityService.updateFacilityPostalAddress({...this.geoPoint, postalCode: this.postalAddress.postalCode, facilityId: this.facilityId})

        if(!hasError(resp)) {
          showToast(translate("Facility latitude & longitude updated successfully."))
          await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update facility latitude and longitude."))
        logger.error(err)
      }
      modalController.dismiss()
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      colorWandOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>