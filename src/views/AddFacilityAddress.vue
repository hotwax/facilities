<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-facilities" slot="start" />
        <ion-title>{{ translate("Add Store Address") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Address') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-input :label="translate('Shipping name')" label-placement="floating" v-model="formData.toName" />
            </ion-item>
            <ion-item>
              <ion-input label-placement="floating" v-model="formData.address1">
                <div slot="label">{{ translate('Address line 1') }} <ion-text color="danger">*</ion-text></div>
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input :label="translate('Address line 2')" label-placement="floating" v-model="formData.address2" />
            </ion-item>
            <ion-item>
              <ion-input label-placement="floating" v-model="formData.city">
                <div slot="label">{{ translate('City') }} <ion-text color="danger">*</ion-text></div>
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input label-placement="floating" v-model="formData.postalCode">
                <div slot="label">{{ translate('Zipcode') }} <ion-text color="danger">*</ion-text></div>
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-select :label="translate('Country')" label-placement="floating" interface="popover" :placeholder="translate('Select country')" @ionChange="updateState($event)" v-model="formData.countryGeoId">
                <ion-select-option v-for="country in countries" :key="country.geoId" :value="country.geoId">
                  {{ country.geoName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-select :label="translate('State')" label-placement="floating" interface="popover" :disabled="!formData.countryGeoId" :placeholder="translate('Select state')" v-model="formData.stateProvinceGeoId">
                <ion-select-option v-for="state in states[formData.countryGeoId]" :key="state.geoId" :value="state.geoId">
                  {{ state.wellKnownText && state.wellKnownText !== state.geoName ? `${state.geoName} (${state.wellKnownText})` : state.geoName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input :label="translate('Contact number')" :label-placement="countryCode ? 'stacked' : 'floating'" v-model="contactNumber" @keydown="inputCountValidation">
                <ion-text slot="start" v-if=countryCode>{{ countryCode }}</ion-text>
              </ion-input>
            </ion-item>
            <ion-item lines="none">
              <ion-input label-placement="floating" :label="translate('Email address')" v-model="emailAddress" />
            </ion-item>
          </ion-list>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Latitude & Longitude') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-input v-model="formData.postalCode" :placeholder="translate('Zipcode')">
                <ion-button :disabled="!formData.postalCode || !formData.address1 || !formData.city" @click="generateLatLong()" slot="end" fill="outline">
                  <ion-icon slot="end" :icon='colorWandOutline' />
                  {{ translate('Generate') }}
                </ion-button>
              </ion-input>
            </ion-item>
            <ion-item>
              <ion-input :label="translate('Latitude')" label-placement="floating" :disabled="!formData.address1 || !formData.city" v-model="formData.latitude" />
            </ion-item>
            <ion-item lines="none">
              <ion-input :label="translate('Longitude')" label-placement="floating" :disabled="!formData.address1 || !formData.city" v-model="formData.longitude" />
            </ion-item>
          </ion-list>
        </ion-card>
        <div class="ion-text-center ion-margin">
          <ion-button @click="addAddress()">
            <ion-icon slot="start" :icon="locationOutline"/>
            {{ translate("Save address") }}
          </ion-button>
          <ion-button @click="router.replace(`/add-facility-config/${facilityId}`)" color="medium" fill="clear">
            {{ translate("Add address later") }}
          </ion-button>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters, useStore } from "vuex";
import { useRouter } from 'vue-router'
import { colorWandOutline, locationOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { showToast, isValidEmail } from "@/utils";
import logger from "@/logger";
import { getTelecomCountryCode, hasError } from "@/adapter";
import { FacilityService } from "@/services/FacilityService";
import { UtilService } from "@/services/UtilService";

export default defineComponent({
  name: "AddFacilityAddress",
  components: {
    IonBackButton,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonList,
    IonPage,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      countries: 'util/getCountries',
      states: 'util/getStates',
      current: 'facility/getCurrent',
    })
  },
  data() {
    return {
      formData: {
        toName: '',
        address1: '',
        address2: '',
        city: '',
        postalCode: '',
        stateProvinceGeoId: '',
        countryGeoId: '',
        latitude: '',
        longitude: '',
      },
      contactNumber: '',
      countryCode: '',
      emailAddress: ''
    }
  },
  props: ['facilityId'],
  async ionViewDidEnter() {
    this.formData.toName = this.current?.facilityName ? this.current.facilityName : ''
    await this.store.dispatch('util/fetchCountries', { countryGeoId: "USA" })
  },
  methods: {
    inputCountValidation(event: any){
      if (/[^0-9-]/.test(event.key) && event.key !== 'Backspace') event.preventDefault();
    },
    async addAddress() {
      let resp;
      if (!this.formData.address1 || !this.formData.city || !this.formData.postalCode) {
        showToast("Please fill all the required fields.")
        return
      }

      if(this.emailAddress && !isValidEmail(this.emailAddress)) {
        showToast(translate("Invalid email address"))
        return
      }

      const payload = {
        facilityId: this.facilityId,
        contactMechPurposeTypeId: 'PRIMARY_LOCATION',
        ...this.formData
      }

      try {
        resp = await FacilityService.createFacilityPostalAddress(payload)
        if (!hasError(resp)) {
          showToast(translate("Facility address created successfully."))
          this.router.replace(`/add-facility-config/${this.facilityId}`)
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate("Failed to create facility address."))
        logger.error("Failed to create facility address.", error)
      }
      if(this.contactNumber) this.saveTelecomNumber()
      if(this.emailAddress) this.saveEmailAddress()
    },
    async generateLatLong() {
      const postalCode = this.formData.postalCode;
      const query = postalCode.startsWith('0') ? `${postalCode} OR ${postalCode.substring(1)}` : postalCode;

      const payload = {
        json: {
          params: {
            q: `postcode: ${query}`
          }
        }
      }
      try {
        const resp = await UtilService.generateLatLong(payload)
        if (!hasError(resp)) {
          const result = resp.data.response.docs[0]
          this.formData.latitude = result.latitude
          this.formData.longitude = result.longitude
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate("Unable to find the latitude and longitude for the entered zip code."))
        logger.error("Unable to find the latitude and longitude for the entered zip code.", error)
      }
    },
    async updateState(event: CustomEvent) {
      await this.store.dispatch('util/fetchStates', { geoId: event.detail.value })
      const country = this.countries.find((country: any) => country.geoId === event.detail.value)
      this.countryCode = getTelecomCountryCode(country.geoCode)
    },
    async saveTelecomNumber() {
      try {
        const resp = await FacilityService.createFacilityTelecomNumber({
          facilityId: this.facilityId,
          contactMechPurposeTypeId: 'PRIMARY_PHONE',
          contactNumber: this.contactNumber.trim(),
          countryCode: this.countryCode.replace('+', '')
        })

        if(hasError(resp)) {
          throw resp.data;
        }
      } catch(err) {
        logger.error(err)
      }
    },
    async saveEmailAddress() {
      try {
        const resp = await FacilityService.createFacilityEmailAddress({
          facilityId: this.facilityId,
          contactMechTypeId: 'EMAIL_ADDRESS',
          contactMechPurposeTypeId: 'PRIMARY_EMAIL',
          emailAddress: this.emailAddress,
        })

        if(hasError(resp)) {
          throw resp.data;
        }
      } catch(err) {
        logger.error(err)
      }
    }
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      colorWandOutline,
      locationOutline,
      store,
      router,
      translate
    };
  }
});
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>