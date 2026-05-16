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
        <ion-input :label="translate('Directions')" label-placement="floating" v-model="address.directions" />
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
        <ion-input label-placement="floating" v-model="address.postalCode" @keydown="validateZipCode($event)">
          <div slot="label">{{ translate("Zipcode") }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item-divider color="light">
        <ion-label>{{ translate("Contact details") }}</ion-label>
      </ion-item-divider>
      <ion-item>
        <ion-input :label="translate('Contact number')" :label-placement="telecomNumberValue?.countryCode ? 'stacked' : 'floating'" v-model="telecomNumberValue.contactNumber">
          <ion-text slot="start" v-if="telecomNumberValue?.countryCode && telecomNumberValue?.contactNumber">{{ telecomNumberValue?.countryCode }}</ion-text>
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

<script setup lang="ts">
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
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import { FacilityService } from '@/services/FacilityService';
import { commonUtil } from "@common";
import logger from "@/logger";
import { isValidEmail } from "@/utils";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed, onMounted } from "vue";

const props = defineProps(['facilityId', 'facilityName']);

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const postalAddress = computed(() => facilityStore.getPostalAddress);
const countries = computed(() => utilStore.getCountries);
const states = computed(() => utilStore.getStates);
const contactDetails = computed(() => facilityStore.getTelecomAndEmailAddress);

const address = ref({} as any);
const telecomNumberValue = ref({} as any);
const emailAddress = ref({} as any);

onMounted(async () => {
  address.value = JSON.parse(JSON.stringify(postalAddress.value));
  telecomNumberValue.value = contactDetails.value?.telecomNumber ? JSON.parse(JSON.stringify(contactDetails.value.telecomNumber)) : {};
  emailAddress.value = contactDetails.value?.emailAddress ? JSON.parse(JSON.stringify(contactDetails.value.emailAddress)) : {};

  await utilStore.fetchCountries({ countryGeoId: address.value?.countryGeoId });
  if (address.value.countryGeoId) {
    const country = countries.value.find((country: any) => country.geoId === address.value.countryGeoId);
    if (country) {
      telecomNumberValue.value.countryCode = commonUtil.getTelecomCountryCode(country.geoCode);
    }
  }
  if (!address.value.toName) {
    address.value.toName = props.facilityName;
  }
});

function closeModal() {
  modalController.dismiss();
}

function validateZipCode(e: any) {
  if (/[`!@#$%^&*()_+=\\|,.<>?~{};:'"/]/.test(e.key)) {
    e.preventDefault();
    return false;
  }
}

function isAddressUpdated() {
  if (!Object.keys(postalAddress.value).length) return true;
  return Object.entries(postalAddress.value).some(([addressKey, addressValue]) => address.value[addressKey] !== addressValue);
}

function isTelecomNumberUpdated() {
  return !Object.is(telecomNumberValue.value?.contactNumber, contactDetails.value?.telecomNumber?.contactNumber);
}

function isEmailAddressUpdated() {
  return emailAddress.value?.infoString && JSON.stringify(emailAddress.value.infoString) !== JSON.stringify(contactDetails.value?.emailAddress?.infoString);
}

async function saveTelecomNumber() {
  let resp = {} as any;
  const payload = {
    facilityId: props.facilityId,
    contactMechPurposeTypeId: 'PRIMARY_PHONE',
    contactNumber: telecomNumberValue.value.contactNumber.trim(),
    countryCode: telecomNumberValue.value.countryCode.replace('+', '')
  };

  try {
    if (contactDetails.value.telecomNumber?.contactMechId) {
      resp = await FacilityService.updateFacilityTelecomNumber({
        ...payload,
        contactMechId: contactDetails.value.telecomNumber.contactMechId,
      });
    } else {
      resp = await FacilityService.createFacilityTelecomNumber(payload);
    }

    if (!commonUtil.hasError(resp)) {
      await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
}

async function saveEmailAddress() {
  let resp = {} as any;
  const payload = {
    facilityId: props.facilityId,
    emailAddress: emailAddress.value.infoString
  };

  try {
    if (contactDetails.value.emailAddress?.contactMechId) {
      resp = await FacilityService.updateFacilityEmailAddress({
        ...payload,
        contactMechId: emailAddress.value.contactMechId,
      });
    } else {
      resp = await FacilityService.createFacilityEmailAddress({
        ...payload,
        contactMechTypeId: 'EMAIL_ADDRESS',
        contactMechPurposeTypeId: 'PRIMARY_EMAIL',
      });
    }

    if (!commonUtil.hasError(resp)) {
      await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }
}

async function saveContact() {
  let resp;
  let savedPostalAddress = '';

  if (!address.value?.address1 || !address.value?.city || !address.value?.postalCode) {
    commonUtil.showToast("Please fill all the required fields.");
    return;
  }

  if (emailAddress.value.infoString && !isValidEmail(emailAddress.value.infoString)) {
    commonUtil.showToast(translate("Invalid email address"));
    return;
  }

  emitter.emit('presentLoader');
  const telecomUpdated = isTelecomNumberUpdated();
  const emailUpdated = isEmailAddressUpdated();

  if (isAddressUpdated()) {
    try {
      if (address.value.contactMechId) {
        resp = await FacilityService.updateFacilityPostalAddress({ ...address.value, facilityId: props.facilityId });
      } else {
        resp = await FacilityService.createFacilityPostalAddress({
          ...address.value,
          facilityId: props.facilityId,
          contactMechPurposeTypeId: 'PRIMARY_LOCATION'
        });
      }

      if (!commonUtil.hasError(resp)) {
        savedPostalAddress = address.value;
        await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
        commonUtil.showToast(translate("Facility contact updated successfully."));
      } else {
        throw resp.data;
      }
    } catch (err) {
      commonUtil.showToast(translate("Failed to update facility contact."));
      logger.error(err);
    }
  }

  if (telecomUpdated) await saveTelecomNumber();
  if (emailUpdated) await saveEmailAddress();

  modalController.dismiss({ postalAddress: savedPostalAddress });
  emitter.emit('dismissLoader');
}

function updateState(ev: CustomEvent) {
  utilStore.fetchStates({ geoId: ev.detail.value });
  const country = countries.value.find((country: any) => country.geoId === ev.detail.value);
  if (country) {
    telecomNumberValue.value.countryCode = commonUtil.getTelecomCountryCode(country.geoCode);
  }
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>