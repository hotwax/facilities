<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Custom mapping") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Facility details") }}</ion-list-header>
      <ion-item>
        <ion-label>{{ translate("Facility ID") }}</ion-label>
        <p>{{ currentFacility.facilityId }}</p>
      </ion-item>
      <ion-item lines="none">
        <ion-label>{{ translate("Facility name") }}</ion-label>
        <p>{{ currentFacility.facilityName }}</p>
      </ion-item>
    </ion-list>

    <ion-list>
      <ion-list-header>{{ translate("Custom mapping") }}</ion-list-header>
      <ion-item>
        <ion-label>{{ translate("Mapping ID") }}</ion-label>
        <ion-input v-model="mappingId" placeholder="Mapping ID" />
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Mapping Name") }}</ion-label>
        <ion-input v-model="mappingName" placeholder="Mapping name" />
      </ion-item>
      <ion-item>
        <ion-label>{{ translate("Identification") }}</ion-label>
        <ion-input v-model="mappingValue" placeholder="Mapping Value" />
      </ion-item>
    </ion-list>
  </ion-content>
  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveMapping">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
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
import { showToast } from "@/utils";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import logger from "@/logger";

export default defineComponent({
  name: "CustomMappingModal",
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
  data() {
    return {
      mappingId: '',
      mappingName: '',
      mappingValue: ''
    }
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
    async saveMapping() {
      if(!this.mappingId.trim() || !this.mappingName.trim() || !this.mappingValue.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      let resp;

      try {
        resp = await FacilityService.createEnumeration({
          "enumId": this.mappingId,
          "enumTypeId": "FACILITY_IDENTITY",
          "description": this.mappingName
        })

        if(!hasError(resp) && resp.data.enumId) {
          resp = await FacilityService.createFacilityIdentification({
            "facilityId": this.currentFacility.facilityId,
            "facilityIdenTypeId": resp.data.enumId,
            "idValue": this.mappingValue
          })
  
          if(!hasError(resp)) {
            showToast(translate('External mapping created successfully'))
            // fetching external mapping types again, as we have created a new mapping type that needs to be included in popover
            // added skipState property to not check for cached type and always make an api call
            await this.store.dispatch('util/fetchExternalMappingTypes', { skipState: true })
            this.store.dispatch('facility/fetchFacilityMappings', { facilityId: this.currentFacility.facilityId })
            this.closeModal();
          } else {
            throw resp.data
          }
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to create external mapping'))
        logger.error('Failed to create external mapping', err)
      }
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>