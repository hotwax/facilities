<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/find-facilities" slot="start" />
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
              <ion-label position="floating">
                {{ translate('Address line 1') }} <ion-text color="danger">*</ion-text>
              </ion-label>
              <ion-input v-model="formData.address1" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Address line 2') }}
              </ion-label>
              <ion-input v-model="formData.address2" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('City') }} <ion-text color="danger">*</ion-text>
              </ion-label>
              <ion-input v-model="formData.city" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Zipcode') }}
              </ion-label>
              <ion-input v-model="formData.postalCode" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Country') }}
              </ion-label>
              <ion-select interface="popover" :placeholder="translate('Select country')" @ionChange="updateState($event)" v-model="formData.countryGeoId">
                <ion-select-option v-for="country in countries" :key="country.geoId" :value="country.geoId">
                  {{ country.geoName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('State') }}
              </ion-label>
              <ion-select interface="popover" :placeholder="translate('Select state')" v-model="formData.stateProvinceGeoId">
                <ion-select-option v-for="state in states[formData.countryGeoId]" :key="state.geoId" :value="state.geoId">
                  {{ state.geoName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ translate('Latitude & Longitude') }}</ion-card-title>
          </ion-card-header>
          <ion-list>
            <ion-item>
              <ion-input v-model="formData.postalCode" :placeholder="translate('Zipcode')" />
              <ion-button :disabled="!formData.postalCode || !formData.address1 || !formData.city" @click="generateLatLong()" slot="end" fill="outline">
                <ion-icon slot="end" :icon='colorWandOutline' />
                {{ translate('Generate') }}
              </ion-button>
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Latitude') }}
              </ion-label>
              <ion-input :disabled="!formData.address1 || !formData.city" v-model="formData.latitude" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">
                {{ translate('Longitude') }}
              </ion-label>
              <ion-input :disabled="!formData.address1 || !formData.city" v-model="formData.longitude" />
            </ion-item>
          </ion-list>
        </ion-card>
        <div class="ion-text-center ion-margin">
          <ion-button @click="addAddress()">
            <ion-icon slot="start" :icon="locationOutline"/>
            {{ translate("Save address") }}
          </ion-button>
          <ion-button @click="router.replace(`/add-facility-config/${facilityId}`)" fill="clear">
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
  IonLabel,
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
import { showToast } from "@/utils";
import logger from "@/logger";
import { hasError } from "@/adapter";
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
    IonLabel,
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
      states: 'util/getStates'
    })
  },
  data() {
    return {
      formData: {
        address1: '',
        address2: '',
        city: '',
        postalCode: '',
        stateProvinceGeoId: '',
        countryGeoId: '',
        latitude: '',
        longitude: '',
      }
    }
  },
  props: ['facilityId'],
  async ionViewWillEnter() {
    await this.store.dispatch('util/fetchCountries', { countryGeoId: "USA" })
  },
  methods: {
    async addAddress() {
      let resp;
      if (!this.formData.address1 || !this.formData.city) {
        showToast("Please fill all the required fields.")
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
    },
    async generateLatLong() {
      const payload = {
        json: {
          params: {
            q: `postcode: ${this.formData.postalCode}`
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
        showToast(translate("Failed to generate latitude and longitude."))
        logger.error("Failed to generate latitude and longitude.", error)
      }
    },
    async updateState(event: CustomEvent) {
      await this.store.dispatch('util/fetchStates', { geoId: event.detail.value })
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