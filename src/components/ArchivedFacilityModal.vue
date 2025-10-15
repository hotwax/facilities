<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Archived parking") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-list v-if="archivedFacilities.length">
      <ion-item v-for="(archivedFacility, index) in archivedFacilities" :key="index">
        <ion-label>
          {{ archivedFacility.facilityName }}
          <p>{{ archivedFacility.facilityId }}</p>
        </ion-label>
        <ion-button fill="clear" size="default" color="medium" @click="unarchiveFacility(archivedFacility)">
          <ion-icon slot="icon-only" :icon="gitPullRequestOutline" />
        </ion-button>
      </ion-item>
    </ion-list>
    <div v-else class='empty-state'>
      {{ translate('No archived parkings to show.') }}
    </div>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, gitPullRequestOutline } from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components'
import { showToast } from '@/utils';
import logger from "@/logger";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { mapGetters, useStore } from "vuex";
import { DateTime } from "luxon";

export default defineComponent({
  name: "ArchivedFacilityModal",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      archivedFacilities: 'facility/getArchivedFacilities',
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async unarchiveFacility(archivedFacility: any) {
      try {
        const resp = await FacilityService.updateFacilityToGroup({
          facilityId: archivedFacility.facilityId,
          facilityGroupId: "ARCHIVE",
          fromDate: archivedFacility.fromDate,
          thruDate: DateTime.now().toMillis()
        })

        if (!hasError(resp)) {
          showToast(translate("Parking unarchived successfully."))
          const archivedFacilities = JSON.parse(JSON.stringify(this.archivedFacilities)).filter((facility: any) => facility.facilityId !== archivedFacility.facilityId)
          this.store.dispatch('facility/updateArchivedFacilities', archivedFacilities)
          await this.store.dispatch('facility/fetchVirtualFacility', { facilityId: archivedFacility.facilityId })
        } else {
          throw resp.data
        }
      } catch (err) {
        showToast(translate("Failed to unarchive parking."))
        logger.error(err)
      }
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      gitPullRequestOutline,
      store,
      translate
    }
  },
});
</script> 