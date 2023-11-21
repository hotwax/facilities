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
    <ion-item>
      <ion-label>{{ translate("Type") }}</ion-label>
      <ion-select interface="popover" :placeholder="translate('Select')" value="bulk" required>
        <ion-select-option>{{ "pick/primary" }}</ion-select-option>
        <ion-select-option>{{ "bulk" }}</ion-select-option>
      </ion-select>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Area") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="area" v-model="locationInfo.areaId"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Aisle") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="aisle" v-model="locationInfo.aisleId"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Section") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="section" v-model="locationInfo.sectionId"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Level") }} <ion-text color="danger">*</ion-text></ion-label>
      <ion-input placeholder="level" v-model="locationInfo.levelId"/>
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Sequence") }}</ion-label>
      <ion-input placeholder="sequence" v-model="locationInfo.positionId"/>
    </ion-item>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveFacilityLocation">
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
import { mapGetters } from 'vuex'
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
      current: 'facility/getCurrent'
    })
  },
  methods: {
    closeModal(result?: string) {
      modalController.dismiss({ result });
    },
    saveFacilityLocation() {
      if(!this.locationInfo.aisleId.trim() || !this.locationInfo.areaId.trim() || !this.locationInfo.positionId.trim() || !this.locationInfo.sectionId.trim() || !this.locationInfo.levelId.trim()) {
        showToast(translate('Please fill all the required fields'))
        return;
      }

      // checking for locationSeqId as when adding new facility we won't be having locationSeqId
      if(this.location.locationSeqId) {
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
          this.closeModal('success');
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
          this.closeModal('success');
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
    return {
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>