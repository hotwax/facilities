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
        <ion-input aria-label="zipcode" :placeholder="translate('Zipcode')" v-model="geoPoint.postalCode" @keydown="validateZipCode($event)" @ionInput="postalCodeUpdate"/>
        <ion-button slot="end" fill="outline" :disabled="!isPostalCodeChanged" @click="generateLatLong">
          {{ translate("Generate") }}
          <ion-icon v-if="!isGeneratingLatLong" slot="end" :icon="colorWandOutline" />
          <ion-spinner v-else data-spinner-size="small"/>
        </ion-button>
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" type="number" v-model="geoPoint.latitude">
          <div slot="label">{{ translate("Latitude")}}<ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" type="number" v-model="geoPoint.longitude">
          <div slot="label">{{ translate("Longitude")}}<ion-text color="danger">*</ion-text></div>
        </ion-input>  
      </ion-item>
    </form>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveGeoPoint">
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
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, colorWandOutline, saveOutline } from "ionicons/icons";
import { translate, commonUtil } from "@common"
import { UtilService } from "@/services/UtilService";
import logger from "@/logger";
import { FacilityService } from '@/services/FacilityService'
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { ref, computed, onMounted } from "vue";

const props = defineProps(['facilityId']);
const facilityStore = useFacilityStore();
const postalAddress = computed(() => facilityStore.getPostalAddress);

const geoPoint = ref({} as any);
const isGeneratingLatLong = ref(false);
const isPostalCodeChanged = ref(false);

onMounted(() => {
  geoPoint.value = JSON.parse(JSON.stringify(postalAddress.value));
});

function closeModal() {
  modalController.dismiss();
}

function postalCodeUpdate() {
  isPostalCodeChanged.value = geoPoint.value.postalCode !== postalAddress.value.postalCode;
}

function validateZipCode(e: any) {
  if (/[`!@#$%^&*()_+=\\|,.<>?~{};:'"/]/.test(e.key)) {
    e.preventDefault();
    return false;
  }
}

async function generateLatLong() {
  if (!geoPoint.value.postalCode?.trim()) {
    commonUtil.showToast(translate("Please fill in the required Zipcode"));
    return;
  }
  isGeneratingLatLong.value = true;
  const postalCode = geoPoint.value.postalCode;
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

    if (!commonUtil.hasError(resp) && resp.data.response.docs.length > 0) {
      const result = resp.data.response.docs[0];
      geoPoint.value.latitude = result.latitude;
      geoPoint.value.longitude = result.longitude;
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate("Unable to find the latitude and longitude for the entered zip code."));
    logger.error('Unable to find the latitude and longitude for the entered zip code.', err);
  }
  isGeneratingLatLong.value = false;
}

async function saveGeoPoint() {
  if (!geoPoint.value.latitude || !geoPoint.value.longitude) {
    commonUtil.showToast("Please fill all the required fields");
    return;
  }
  // Convert latitude and longitude to numeric form
  geoPoint.value.latitude = parseFloat(geoPoint.value.latitude);
  geoPoint.value.longitude = parseFloat(geoPoint.value.longitude);

  emitter.emit('presentLoader');

  let geoPointsResult = {} as any;

  try {
    // passing old postalCode from here, as we don't allow user to update postalCode from this modal,
    // and the user can only update the latLon from here
    const resp = await FacilityService.updateFacilityPostalAddress({ ...geoPoint.value, postalCode: postalAddress.value.postalCode, facilityId: props.facilityId });

    if (!commonUtil.hasError(resp)) {
      geoPointsResult = geoPoint.value;
      commonUtil.showToast(translate("Facility latitude and longitude updated successfully."));
      await facilityStore.fetchFacilityContactDetailsAndTelecom({ facilityId: props.facilityId });
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate("Failed to update facility latitude and longitude."));
    logger.error(err);
  }
  modalController.dismiss({ geoPoints: geoPointsResult });
  emitter.emit('dismissLoader');
}
</script>

<style scoped>
[data-spinner-size="small"] {
  transform: scale(0.5);
}
</style>