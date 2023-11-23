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
    <form @keyup.enter="saveAddress">
      <ion-item>
        <ion-label>{{ translate("Address line 1") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="address.address1" slot="end" />
      </ion-item>
      <ion-item class="ion-margin-bottom">
        <ion-label>{{ translate("Address line 2") }}</ion-label>
        <ion-input v-model="address.address2" slot="end" />
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("City") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="address.city" slot="end" />
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-label>{{ translate("Country") }}</ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" @ionChange="updateState($event)" v-model="address.countryGeoId">
          <ion-select-option v-for="country in countries" :key="country.geoId" :value="country.geoId">{{ country.geoName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-label>{{ translate("State") }}</ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" v-model="address.stateGeoId">
          <ion-select-option v-for="state in states[address.countryGeoId]" :key="state.geoId" :value="state.geoId">{{ state.geoName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Zipcode") }}</ion-label>
        <ion-input v-model="address.postalCode" slot="end" />
      </ion-item>
    </form>
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
  data() {
    return {
      address: {} as any
    }
  },
  props: ['facilityId'],
  async mounted() {
    this.address = JSON.parse(JSON.stringify(this.postalAddress))
    await this.store.dispatch('util/fetchCountries', { countryGeoId: this.address?.countryGeoId })
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveAddress() {
      const isAddressUpdated = Object.entries(this.postalAddress).filter(([addressKey, addressValue]) => this.address[addressKey] !== addressValue).length
      if(!isAddressUpdated) {
        showToast(translate("Please fill all the required fields"))
        return;
      }

      let resp;

      if(!this.address?.address1 || !this.address?.city) {
        showToast("Please fill all the required fields.")
        return
      }

      const payload = {
        address1: this.address.address1,
        address2: this.address.address2,
        city: this.address.city,
        countryGeoId: this.address.countryGeoId,
        facilityId: this.facilityId,
        postalCode: this.address.postalCode,
        stateProvinceGeoId: this.address.stateGeoId
      }

      try {
        if(this.address.contactMechId) {
          resp = await FacilityService.updateFacilityPostalAddress({...payload, contactMechId: this.address.contactMechId})
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