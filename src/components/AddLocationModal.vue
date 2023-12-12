<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Location") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="saveFacilityLocation">
      <!-- Using stop for enter key as when using keyboard for opening the select we need to use enter and the same key submits the form
      so to prevent form submission on using enter key on select used stop -->
      <ion-item @keyup.enter.stop>
        <ion-label position="floating">{{ translate("Type") }}</ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" v-model="locationInfo.locationTypeEnumId">
          <ion-select-option v-for="(description, type) in locationTypes" :key="type" :value="type">{{ description }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Area") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="locationInfo.areaId"/>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Aisle") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="locationInfo.aisleId"/>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Section") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="locationInfo.sectionId"/>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Level") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input v-model="locationInfo.levelId"/>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate("Sequence") }}</ion-label>
        <ion-input v-model="locationInfo.positionId"/>
      </ion-item>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="saveFacilityLocation" @keyup.enter.stop>
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { mapGetters, useStore } from 'vuex'
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import logger from "@/logger";
import emitter from "@/event-bus";

export default defineComponent({
  name: "AddLocationModal",
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
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar
  },
  props: ["location"],
  data() {
    return {
      locationInfo: {} as any
    }
  },
  beforeMount() {
    this.locationInfo = this.location ? JSON.parse(JSON.stringify(this.location)) : {}
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent',
      locationTypes: 'util/getLocationTypes'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss();
    },
    async saveFacilityLocation() {
      if(!this.locationInfo.aisleId?.trim() || !this.locationInfo.areaId?.trim() || !this.locationInfo.sectionId?.trim() || !this.locationInfo.levelId?.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      // checking for locationSeqId as when adding new facility we won't be having locationSeqId
      if(this.location?.locationSeqId) {
        await this.updateFacilityLocation()
      } else {
        await this.addFacilityLocation()
      }

      // fetching facility locations after updating/creating a location
      await this.store.dispatch('facility/fetchFacilityLocations', { facilityId: this.current.facilityId })
    },
    async addFacilityLocation() {
      emitter.emit('presentLoader')
      const params = {
        facilityId: this.current.facilityId,
        ...this.locationInfo
      }

      try {
        const resp = await FacilityService.createFacilityLocation(params)

        if(!hasError(resp)) {
          showToast(translate('Facility location created successfully'))
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create facility location'))
        logger.error('Failed to create facility location', err)
      }
      emitter.emit('dismissLoader')
    },

    async updateFacilityLocation() {
      emitter.emit('presentLoader')
      const params = {
        facilityId: this.current.facilityId,
        ...this.locationInfo
      }

      try {
        const resp = await FacilityService.updateFacilityLocation(params)

        if(!hasError(resp)) {
          showToast(translate('Facility location updated successfully'))
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update facility location'))
        logger.error('Failed to update facility location', err)
      }
      emitter.emit('dismissLoader')
    },
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