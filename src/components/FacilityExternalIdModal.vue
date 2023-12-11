<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate('Facility External ID') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="updateExternalId()" @submit.prevent>
      <ion-list>
        <ion-list-header>{{ translate("Facility details") }}</ion-list-header>
        <ion-item>
          <ion-label>{{ translate("Facility ID") }}</ion-label>
          <ion-label slot="end">{{ currentFacility.facilityId }}</ion-label>
        </ion-item>
        <ion-item lines="none">
          <ion-label>{{ translate("Facility name") }}</ion-label>
          <ion-label slot="end">{{ currentFacility.facilityName }}</ion-label>
        </ion-item>
      </ion-list>

      <ion-list>
        <ion-list-header>{{ translate('Facility External ID') }}</ion-list-header>
        <ion-item>
          <ion-label>{{ translate("Identification") }}</ion-label>
          <ion-input autofocus v-model="currentFacility.externalId" />
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="updateExternalId()" @keyup.enter.stop>
          <ion-icon :icon="saveOutline" />
        </ion-fab-button>
      </ion-fab>
    </form>
  </ion-content>
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
  IonList,
  IonListHeader,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from 'vuex'
import { FacilityService } from '@/services/FacilityService'
import { showToast } from "@/utils";
import { hasError } from "@/adapter";
import logger from "@/logger";
import emitter from "@/event-bus";

export default defineComponent({
  name: "FacilityExternalIdModal",
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
    IonList,
    IonListHeader,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      currentFacility: 'facility/getCurrent'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async updateExternalId() {
      if(!this.currentFacility.externalId?.trim()) {
        showToast(translate('Please enter a valid value'))
        return;
      }

      emitter.emit('presentLoader')

      let resp;

      try {
        resp = await FacilityService.updateFacility({
          "facilityId": this.currentFacility.facilityId,
          "externalId": this.currentFacility.externalId
        })

        if(!hasError(resp)) {
          showToast(translate('Facility external ID updated.'))
          await this.store.dispatch('facility/updateCurrentFacility', this.currentFacility)
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create external mapping'))
        logger.error('Failed to create external mapping', err)
      }

      emitter.emit('dismissLoader')
    }
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>