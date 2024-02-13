<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Address and contact details") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="saveContact()">
      <ion-item-divider color="light">
        <ion-label>{{ translate("Address") }}</ion-label>
      </ion-item-divider>
      <ion-item>
        <ion-label position="floating">{{ translate("Address line 1") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="address.address1" />
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Address line 2") }}</ion-label>
        <ion-input v-model="address.address2" />
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("City") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="address.city" />
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-label position="floating">{{ translate("Country") }}</ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" @ionChange="updateState($event)" v-model="address.countryGeoId">
          <ion-select-option v-for="country in countries" :key="country.geoId" :value="country.geoId">{{ country.geoName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-label position="floating">{{ translate("State") }}</ion-label>
        <ion-select interface="popover" :disabled="!address.countryGeoId" :placeholder="translate('Select')" v-model="address.stateProvinceGeoId">
          <ion-select-option v-for="state in states[address.countryGeoId]" :key="state.geoId" :value="state.geoId">
            {{ state.wellKnownText && state.wellKnownText !== state.geoName ? `${state.geoName} (${state.wellKnownText})` : state.geoName }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Zipcode") }}</ion-label>
        <ion-input v-model="address.postalCode" />
      </ion-item>
      <ion-item-divider color="light">
        <ion-label>{{ translate("Contact details") }}</ion-label>
      </ion-item-divider>
      <ion-item>
        <ion-label :position="countryCode ? 'stacked' : 'floating'">{{ translate("Contact number") }}</ion-label>
        <ion-input v-model="contactNumber">
          <ion-text>{{ countryCode }}</ion-text>
        </ion-input>
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveContact()" :disabled="!isAddressUpdated() && !isTelecomNumberUpdated()">
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
  IonItemDivider,
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
import { getTelecomCode, hasError } from "@/adapter";
import logger from "@/logger";
import { showToast } from "@/utils";
import emitter from "@/event-bus";

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
    IonItemDivider,
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
      states: 'util/getStates',
      telecomNumber: 'facility/getTelecomNumber'
    })
  },
  data() {
    return {
      address: {} as any,
      contactNumber: '',
      countryCode: '' as any
    }
  },
  props: ['facilityId'],
  beforeMount() {
    this.address = JSON.parse(JSON.stringify(this.postalAddress))
    this.contactNumber = this.telecomNumber?.contactNumber
  },
  async mounted() {
    await this.store.dispatch('util/fetchCountries', { countryGeoId: this.address?.countryGeoId })
    if(this.address.countryGeoId) {
      const country = this.countries.find((country: any) => country.geoId === this.address.countryGeoId)
      this.countryCode = getTelecomCode(country.geoCode)
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveContact() {
      let postalAddress = '';

      if(!this.address?.address1 || !this.address?.city) {
        showToast("Please fill all the required fields.")
        return
      }

      emitter.emit('presentLoader')

      try {
        const isTelecomNumberUpdated = this.isTelecomNumberUpdated()

        if(this.isAddressUpdated()){
          postalAddress = await this.saveAddress()
        }

        if(isTelecomNumberUpdated) await this.saveTelecomNumber()

        showToast(translate("Facility contact updated successfully."))
      } catch(err) {
        showToast(translate("Failed to update facility contact."))
        logger.error(err)
      }
      modalController.dismiss({ postalAddress })
      emitter.emit('dismissLoader')
    },
    async saveAddress() {
      let resp = {} as any;

      if (this.address.contactMechId) {
        resp = await FacilityService.updateFacilityPostalAddress({ ...this.address, facilityId: this.facilityId })
      } else {
        resp = await FacilityService.createFacilityPostalAddress({
          ...this.address,
          facilityId: this.facilityId,
          contactMechPurposeTypeId: 'PRIMARY_LOCATION'
        })
      }

      if (hasError(resp)) {
        throw resp.data
      }
      await this.store.dispatch('facility/fetchFacilityContactDetails', { facilityId: this.facilityId })
      return this.address
    },
    async saveTelecomNumber() {
      let resp = {} as any;

      const payload = {
        facilityId: this.facilityId,
        contactMechPurposeTypeId: 'PRIMARY_PHONE',
        contactNumber: this.contactNumber.trim(),
        countryCode: this.countryCode
      }

      if(this.telecomNumber?.contactMechId) {
        resp = await FacilityService.updateFacilityTelecomNumber({
          ...payload,
          contactMechId: this.telecomNumber.contactMechId,
        })
      } else {
        resp = await FacilityService.createFacilityTelecomNumber(payload)
      }

      if (hasError(resp)) {
        throw resp.data
      }
      await this.store.dispatch('facility/fetchFacilityTelecomNumber', { facilityId: this.facilityId })
    },
    updateState(ev: CustomEvent) {
      this.store.dispatch('util/fetchStates', { geoId: ev.detail.value })
      const country = this.countries.find((country: any) => country.geoId === ev.detail.value)
      this.countryCode = getTelecomCode(country.geoCode)
    },
    isAddressUpdated() {
      // in case postal address is not there - new facility is created
      // hence explicitly returning true as .some check will fail
      return Object.keys(this.postalAddress).length
        ? Object.entries(this.postalAddress).some(([addressKey, addressValue]) => this.address[addressKey] !== addressValue)
        : true
    },
    isTelecomNumberUpdated() {
      // Checking whether countryGeoId is changed which implies that country telecom code is also changed.
      return this.contactNumber !== this.telecomNumber?.contactNumber || this.address.countryGeoId !== this.postalAddress.countryGeoId
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      getTelecomCode,
      translate
    };
  },
});
</script>