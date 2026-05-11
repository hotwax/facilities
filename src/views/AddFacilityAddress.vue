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
              <ion-input :label="translate('Directions')" label-placement="floating" v-model="formData.directions" />
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
              <ion-input :label="translate('Contact number')" :label-placement="countryCode ? 'stacked' : 'floating'" v-model="contactNumber" @keydown="inputValidation">
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

<script setup lang="ts">
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
  onIonViewDidEnter
} from "@ionic/vue";
import { ref, computed, reactive } from "vue";
import { useRouter } from 'vue-router'
import { colorWandOutline, locationOutline } from 'ionicons/icons';
import { translate } from "@hotwax/dxp-components";
import { showToast, isValidEmail } from "@/utils";
import logger from "@/logger";
import { getTelecomCountryCode, hasError } from "@/adapter";
import { FacilityService } from "@/services/FacilityService";
import { UtilService } from "@/services/UtilService";
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';

const props = defineProps(['facilityId']);
const router = useRouter();
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const formData = reactive({
  toName: '',
  address1: '',
  address2: '',
  directions: '',
  city: '',
  postalCode: '',
  stateProvinceGeoId: '',
  countryGeoId: '',
  latitude: '',
  longitude: '',
});

const contactNumber = ref('');
const countryCode = ref('');
const emailAddress = ref('');

const countries = computed(() => utilStore.getCountries);
const states = computed(() => utilStore.getStates);
const current = computed(() => facilityStore.getCurrent);

onIonViewDidEnter(async () => {
  formData.toName = current.value?.facilityName ? current.value.facilityName : '';
  await utilStore.fetchCountries({ countryGeoId: "USA" });
});

function inputValidation(event: any) {
  if (/[^0-9-]/.test(event.key) && event.key !== 'Backspace') event.preventDefault();
}

async function addAddress() {
  if (!formData.address1 || !formData.city || !formData.postalCode) {
    showToast("Please fill all the required fields.");
    return;
  }

  if (emailAddress.value && !isValidEmail(emailAddress.value)) {
    showToast(translate("Invalid email address"));
    return;
  }

  const payload = {
    facilityId: props.facilityId,
    contactMechPurposeTypeId: 'PRIMARY_LOCATION',
    ...formData
  };

  try {
    const resp = await FacilityService.createFacilityPostalAddress(payload);
    if (!hasError(resp)) {
      showToast(translate("Facility address created successfully."));
      router.replace(`/add-facility-config/${props.facilityId}`);
    } else {
      throw resp.data;
    }
  } catch (error) {
    showToast(translate("Failed to create facility address."));
    logger.error("Failed to create facility address.", error);
  }
  if (contactNumber.value) saveTelecomNumber();
  if (emailAddress.value) saveEmailAddress();
}

async function generateLatLong() {
  const postalCode = formData.postalCode;
  const query = postalCode.startsWith('0') ? `${postalCode} OR ${postalCode.substring(1)}` : postalCode;

  const payload = {
    json: {
      params: {
        q: `postcode: ${query}`
      }
    }
  };
  try {
    const resp = await UtilService.generateLatLong(payload);
    if (!hasError(resp)) {
      const result = resp.data.response.docs[0];
      formData.latitude = result.latitude;
      formData.longitude = result.longitude;
    } else {
      throw resp.data;
    }
  } catch (error) {
    showToast(translate("Unable to find the latitude and longitude for the entered zip code."));
    logger.error("Unable to find the latitude and longitude for the entered zip code.", error);
  }
}

async function updateState(event: CustomEvent) {
  await utilStore.fetchStates({ geoId: event.detail.value });
  const country = countries.value.find((country: any) => country.geoId === event.detail.value);
  if (country) {
    countryCode.value = getTelecomCountryCode(country.geoCode);
  }
}

async function saveTelecomNumber() {
  try {
    const resp = await FacilityService.createFacilityTelecomNumber({
      facilityId: props.facilityId,
      contactMechPurposeTypeId: 'PRIMARY_PHONE',
      contactNumber: contactNumber.value.trim(),
      countryCode: countryCode.value.replace('+', '')
    });

    if (hasError(resp)) {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
}

async function saveEmailAddress() {
  try {
    const resp = await FacilityService.createFacilityEmailAddress({
      facilityId: props.facilityId,
      contactMechTypeId: 'EMAIL_ADDRESS',
      contactMechPurposeTypeId: 'PRIMARY_EMAIL',
      emailAddress: emailAddress.value,
    });

    if (hasError(resp)) {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
}
</script>

<style scoped>
@media (min-width: 700px) {
  main {
    max-width: 375px;
    margin: auto;
  }
}
</style>