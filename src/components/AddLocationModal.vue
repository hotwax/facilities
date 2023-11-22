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
      <ion-item>
        <ion-label>{{ translate("Type") }}</ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" v-model="locationInfo.locationTypeEnumId">
          <ion-select-option v-for="(description, type) in locationTypes" :key="type" :value="type">{{ description }}</ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Area") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input :placeholder="translate('area')" v-model="locationInfo.areaId"/>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Aisle") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input :placeholder="translate('aisle')" v-model="locationInfo.aisleId"/>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Section") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input :placeholder="translate('section')" v-model="locationInfo.sectionId"/>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Level") }} <ion-text color="danger">*</ion-text></ion-label>
        <ion-input :placeholder="translate('level')" v-model="locationInfo.levelId"/>
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Sequence") }}</ion-label>
        <ion-input :placeholder="translate('sequence')" v-model="locationInfo.positionId"/>
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
  mounted() {
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
    saveFacilityLocation() {
      if(!this.locationInfo.aisleId?.trim() || !this.locationInfo.areaId?.trim() || !this.locationInfo.sectionId?.trim() || !this.locationInfo.levelId?.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      // checking for locationSeqId as when adding new facility we won't be having locationSeqId
      if(this.location?.locationSeqId) {
        this.updateFacilityLocation()
      } else {
        this.addFacilityLocation()
      }
    },
    async addFacilityLocation() {
      const params = {
        facilityId: this.current.facilityId,
        ...this.locationInfo
      }

      try {
        const resp = await FacilityService.createFacilityLocation(params)

        if(!hasError(resp)) {
          showToast(translate('Facility location created successfully'))
          this.closeModal();
          await this.store.dispatch('facility/fetchFacilityLocations')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create facility location'))
        logger.error('Failed to create facility location', err)
      }
    },

    async updateFacilityLocation() {
      const params = {
        facilityId: this.current.facilityId,
        ...this.locationInfo
      }

      try {
        const resp = await FacilityService.updateFacilityLocation(params)

        if(!hasError(resp)) {
          showToast(translate('Facility location updated successfully'))
          this.closeModal();
          await this.store.dispatch('facility/fetchFacilityLocations')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update facility location'))
        logger.error('Failed to update facility location', err)
      }
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