<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Address") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-label>{{ translate("Address line 1") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input v-model="postalAddress.address1" slot="end" />
    </ion-item>
    <ion-item class="ion-margin-bottom">
      <ion-label>{{ translate("Address line 2") }}</ion-label>
      <ion-input v-model="postalAddress.address2" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("City") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input v-model="postalAddress.city" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Country") }}</ion-label>
      <ion-select interface="popover" :placeholder="translate('Select')" @ionChange="updateState($event)" v-model="postalAddress.countryGeoId">
        <ion-select-option v-for="(country, index) in countries" :key="index" :value="country.geoId">{{ country.geoName }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("State") }}</ion-label>
      <ion-select interface="popover" :placeholder="translate('Select')" v-model="postalAddress.stateGeoId">
        <ion-select-option v-for="(state, index) in states" :key="index" :value="state.geoId">{{ state.geoName }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Zipcode") }}</ion-label>
      <ion-input v-model="postalAddress.postalCode" slot="end" />
    </ion-item>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveAddress">
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from '@/services/FacilityService';
import { hasError } from "@/adapter";
import logger from "@/logger";
import { showToast } from "@/utils";

export default defineComponent({
  name: "FacilityAddressModal",
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
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      postalAddress: 'facility/getPostalAddress',
      countries: 'util/getCountries',
      states: 'util/getStates'
    })
  },
  props: ['facilityId'],
  async mounted() {
    await this.store.dispatch('util/fetchCountries', { countryGeoId: this.postalAddress?.countryGeoId })
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveAddress() {
      let resp;

      if(!this.postalAddress?.address1 || !this.postalAddress?.city) {
        showToast("Please fill all the required fields.")
        return
      }

      const payload = {
        address1: this.postalAddress.address1,
        address2: this.postalAddress.address2,
        city: this.postalAddress.city,
        countryGeoId: this.postalAddress.countryGeoId,
        countryGeoName: this.postalAddress.countryGeoName,
        facilityId: this.facilityId,
        postalCode: this.postalAddress.postalCode,
        stateGeoName: this.postalAddress.stateGeoName,
        stateProvinceGeoId: this.postalAddress.stateGeoId
      }

      try {
        if(this.postalAddress.contactMechId) {
          resp = await FacilityService.updateFacilityPostalAddress({...payload, contactMechId: this.postalAddress.contactMechId})
        } else {
          resp = await FacilityService.createFacilityPostalAddress(payload)
        }

        if(!hasError(resp)) {
          showToast(translate("Facility address updated successfully."))
          await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate("Failed to update facility address."))
        logger.error(err)
      }
      modalController.dismiss()
    },
    updateState(ev: CustomEvent) {
      this.store.dispatch('util/fetchStates', { geoId: ev.detail.value })
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>