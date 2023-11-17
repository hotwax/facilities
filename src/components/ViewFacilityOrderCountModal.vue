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

<script lang="ts">
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
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";

export default defineComponent({
  name: "ViewFacilityOrderCountModal",
  components: {
    IonButton,
    IonButtons,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonRow,
    IonTitle,
    IonToolbar
  },
  props: ["facilityId"],
  data() {
    return {
      facilityOrderCounts: [] as Array<any>,
      isLoading: true
    }
  },
  async mounted() {
    this.facilityOrderCounts = await FacilityService.fetchFacilityOrderCounts(this.facilityId)
    this.isLoading = false;
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    }
  },
  setup() {
    return {
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>

<style>
  ion-col {
    text-align: center;
  }
</style>