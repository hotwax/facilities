<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ externalMappingTypes[mappingId] }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="type && type === 'update' ? updateMapping() : saveMapping()" @submit.prevent>
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
        <ion-list-header>{{ externalMappingTypes[mappingId] }}</ion-list-header>
        <ion-item>
          <ion-label>{{ translate("Identification") }}</ion-label>
          <ion-input v-model="mappingValue" placeholder="Mapping Value" />
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="type && type === 'update' ? updateMapping() : saveMapping()" @keyup.enter.stop>
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

export default defineComponent({
  name: "FacilityMappingModal",
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
      currentFacility: 'facility/getCurrent',
      externalMappingTypes: 'util/getExternalMappingTypes'
    })
  },
  data() {
    return {
      mappingValue: ''
    }
  },
  props: ["mappingId", "mapping", "type"],
  mounted() {
    if(this.type) {
      this.mappingValue = this.mapping?.idValue
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss()
    },
    async saveMapping() {
      if(!this.mappingValue.trim()) {
        showToast(translate('Please enter a valid value'))
        return;
      }

      let resp;

      try {
        resp = await FacilityService.createFacilityIdentification({
          "facilityId": this.currentFacility.facilityId,
          "facilityIdenTypeId": this.mappingId,
          "idValue": this.mappingValue
        })

        if(!hasError(resp)) {
          showToast(translate('External mapping created successfully'))
          this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.currentFacility.facilityId })
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create external mapping'))
        logger.error('Failed to create external mapping', err)
      }
    },
    async updateMapping() {
      if(!this.mappingValue.trim()) {
        showToast(translate('Please enter a valid value'))
        return;
      }

      let resp;

      try {
        resp = await FacilityService.updateFacilityIdentification({
          "facilityId": this.currentFacility.facilityId,
          "facilityIdenTypeId": this.mappingId,
          "fromDate": this.mapping.fromDate,
          "idValue": this.mappingValue
        })

        if(!hasError(resp)) {
          showToast(translate('External mapping updated successfully'))
          this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.currentFacility.facilityId })
          this.closeModal();
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update external mapping'))
        logger.error('Failed to update external mapping', err)
      }
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