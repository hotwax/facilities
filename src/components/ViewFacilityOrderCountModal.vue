<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Consumed Order Limit") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-grid v-if="facilityOrderCounts.length && !isLoading">
      <ion-row class="ion-justify-content-center">
        <ion-col>{{ translate('Entry Date') }}</ion-col>
        <ion-col>{{ translate('Consumed Order Limit') }}</ion-col>
      </ion-row>
      <ion-row class="ion-justify-content-center" v-for="facilityOrderCount in facilityOrderCounts" :key="facilityOrderCount.facilityId">
        <ion-col>{{ facilityOrderCount.entryDate }}</ion-col>
        <ion-col>{{ facilityOrderCount.lastOrderCount }}</ion-col>
      </ion-row>
    </ion-grid>
    <div v-else-if="!isLoading" class="ion-text-center ion-padding-top">
      {{ translate('No records found') }}
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonRow,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import { translate } from "@common"
import { FacilityService } from "@/services/FacilityService";
import { onMounted, ref } from "vue";

const props = defineProps(["facilityId"]);
const facilityOrderCounts = ref([] as Array<any>);
const isLoading = ref(true);

function closeModal() {
  modalController.dismiss();
}

onMounted(async () => {
  try {
    facilityOrderCounts.value = await FacilityService.fetchFacilityOrderCounts(props.facilityId);
  } catch (error) {
    console.error("Failed to fetch facility order counts", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
  ion-col {
    text-align: center;
  }
</style>