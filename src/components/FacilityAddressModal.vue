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
        <ion-input id="inputElement" :label="translate('Shipping name')" label-placement="floating" v-model="address.toName" />
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" v-model="address.address1">
          <div slot="label">{{ translate("Address line 1") }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input :label="translate('Address line 2')" label-placement="floating" v-model="address.address2" />
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" v-model="address.city">
          <div slot="label">{{ translate("City") }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-select label-placement="floating" :label="translate('Country')" interface="popover" :placeholder="translate('Select')" @ionChange="updateState($event)" v-model="address.countryGeoId">
          <ion-select-option v-for="country in countries" :key="country.geoId" :value="country.geoId">{{ country.geoName }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item @keyup.enter.stop>
        <ion-select label-placement="floating" :label="translate('State')" interface="popover" :disabled="!address.countryGeoId" :placeholder="translate('Select')" v-model="address.stateProvinceGeoId">
          <ion-select-option v-for="state in states[address.countryGeoId]" :key="state.geoId" :value="state.geoId">
            {{ state.wellKnownText && state.wellKnownText !== state.geoName ? `${state.geoName} (${state.wellKnownText})` : state.geoName }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" v-model="address.postalCode">
          <div slot="label">{{ translate("Zipcode") }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item-divider color="light">
        <ion-label>{{ translate("Contact details") }}</ion-label>
      </ion-item-divider>
      <ion-item>
        <ion-input :label="translate('Contact number')" :label-placement="telecomNumberValue?.countryCode ? 'stacked' : 'floating'" v-model="telecomNumberValue.contactNumber">
          <ion-text slot="start" v-if="telecomNumberValue?.countryCode">{{ telecomNumberValue?.countryCode }}</ion-text>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" :label="translate('Email address')" v-model="emailAddress.infoString" />
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveContact()" :disabled="!isAddressUpdated() && !isTelecomNumberUpdated() && !isEmailAddressUpdated()">
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
import { getTelecomCountryCode, hasError } from "@/adapter";
import logger from "@/logger";
import { showToast, isValidEmail } from "@/utils";
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
      contactDetails: 'facility/getTelecomAndEmailAddress'
    })
  },
  data() {
    return {
      address: {} as any,
      telecomNumberValue: {} as any,
      emailAddress: {} as any
    }
  },
  props: ['facilityId', 'facilityName'],
  beforeMount() {
    this.address = JSON.parse(JSON.stringify(this.postalAddress))
    this.telecomNumberValue = this.contactDetails?.telecomNumber ? JSON.parse(JSON.stringify(this.contactDetails.telecomNumber)) : {}
    this.emailAddress = this.contactDetails?.emailAddress ? JSON.parse(JSON.stringify(this.contactDetails.emailAddress)) : {};
  },
  async mounted() {
    await this.store.dispatch('util/fetchCountries', { countryGeoId: this.address?.countryGeoId })
    if(this.address.countryGeoId) {
      const country = this.countries.find((country: any) => country.geoId === this.address.countryGeoId)
      this.telecomNumberValue.countryCode = getTelecomCountryCode(country.geoCode)
    }
    if(!this.address.toName) {
      this.address.toName = this.facilityName
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveContact() {
      let resp, postalAddress = '';

      if(!this.address?.address1 || !this.address?.city || !this.address?.postalCode) {
        showToast("Please fill all the required fields.")
        return
      }

      if(this.emailAddress.infoString && !isValidEmail(this.emailAddress.infoString)) {
        showToast(translate("Invalid email address"))
        return
      }

      emitter.emit('presentLoader')
      const isTelecomNumberUpdated = this.isTelecomNumberUpdated()
      const isEmailAddressUpdated = this.isEmailAddressUpdated()

      if(this.isAddressUpdated()) {
        try {
          if(this.address.contactMechId) {
            resp = await FacilityService.updateFacilityPostalAddress({ ...this.address, facilityId: this.facilityId })
          } else {
            resp = await FacilityService.createFacilityPostalAddress({
              ...this.address,
              facilityId: this.facilityId,
              contactMechPurposeTypeId: 'PRIMARY_LOCATION'
            })
          }

          if(!hasError(resp)) {
            postalAddress = this.address
            await this.store.dispatch('facility/fetchFacilityContactDetailsAndTelecom', { facilityId: this.facilityId })
            showToast(translate("Facility contact updated successfully."))
          } else {
            throw resp.data
          }
        } catch(err) {
          showToast(translate("Failed to update facility contact."))
          logger.error(err)
        }
      }

      if(isTelecomNumberUpdated) await this.saveTelecomNumber()
      if(isEmailAddressUpdated) await this.saveEmailAddress()

      modalController.dismiss({ postalAddress })
      emitter.emit('dismissLoader')
    },
    async saveTelecomNumber() {
      let resp = {} as any;

      const payload = {
        facilityId: this.facilityId,
        contactMechPurposeTypeId: 'PRIMARY_PHONE',
        contactNumber: this.telecomNumberValue.contactNumber.trim(),
        countryCode: this.telecomNumberValue.countryCode.replace('+', '')
      }

      try {
        if(this.contactDetails.telecomNumber?.contactMechId) {
          resp = await FacilityService.updateFacilityTelecomNumber({
            ...payload,
            contactMechId: this.contactDetails.telecomNumber.contactMechId,
          })
        } else {
          resp = await FacilityService.createFacilityTelecomNumber(payload)
        }

        if(!hasError(resp)) {
          await this.store.dispatch('facility/fetchFacilityContactDetailsAndTelecom', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    async saveEmailAddress() {
      let resp = {} as any;

      const payload = {
        facilityId: this.facilityId,
        emailAddress: this.emailAddress.infoString
      }

      try {
        if(this.contactDetails.emailAddress?.contactMechId) {
          resp = await FacilityService.updateFacilityEmailAddress({
            ...payload,
            contactMechId: this.emailAddress.contactMechId,
          })
        } else {
          resp = await FacilityService.createFacilityEmailAddress({
            ...payload,
            contactMechTypeId: 'EMAIL_ADDRESS',
            contactMechPurposeTypeId: 'PRIMARY_EMAIL',
          })
        }

        if(!hasError(resp)) {
          await this.store.dispatch('facility/fetchFacilityContactDetailsAndTelecom', { facilityId: this.facilityId })
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    updateState(ev: CustomEvent) {
      this.store.dispatch('util/fetchStates', { geoId: ev.detail.value })
      const country = this.countries.find((country: any) => country.geoId === ev.detail.value)
      this.telecomNumberValue.countryCode = getTelecomCountryCode(country.geoCode)
    },
    isAddressUpdated() {
      // in case postal address is not there - new facility is created
      // hence explicitly returning true as .some check will fail
      return Object.keys(this.postalAddress).length
        ? Object.entries(this.postalAddress).some(([addressKey, addressValue]) => this.address[addressKey] !== addressValue)
        : true
    },
    isTelecomNumberUpdated() {
      return this.telecomNumberValue?.contactNumber && JSON.stringify(this.telecomNumberValue.contactNumber) !== JSON.stringify(this.contactDetails?.telecomNumber?.contactNumber)
    },
    isEmailAddressUpdated() {
      return this.emailAddress?.infoString && JSON.stringify(this.emailAddress.infoString) !== JSON.stringify(this.contactDetails?.emailAddress?.infoString);
    },
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      getTelecomCountryCode,
      translate
    };
  },
});
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>