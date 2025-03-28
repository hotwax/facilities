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
  <ion-content v-if="archivedFacilities.length">
    <ion-list>
      <ion-item v-for="(archivedFacility, index) in archivedFacilities" :key="index">
        <ion-label>
          {{ archivedFacility.facilityName }}
          <p>{{ archivedFacility.facilityId }}</p>
        </ion-label>
        <ion-button fill="clear" color="medium" @click="unarchiveFacility(archivedFacility)">
          <ion-icon slot="icon-only" :icon="gitPullRequestOutline" />
        </ion-button>
      </ion-item>
    </ion-list>
    <!-- <ion-infinite-scroll @ionInfinite="loadMoreArchivedFacilities($event)" threshold="100px" :disabled="!isScrollable"> -->
    <ion-infinite-scroll @ionInfinite="loadMoreArchivedFacilities($event)" threshold="100px">
      <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
    </ion-infinite-scroll>
  </ion-content>
    <div v-else class='empty-state'>
      {{ translate('No archived parkings to show.') }}
    </div>
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
      isScrollable: 'facility/isArchivedFacilitiesScrollable'
    })
  },
  mounted() {
    this.fetchArchivedFacilities();
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
    },
    async fetchArchivedFacilities(vSize?: any, vIndex?: any){
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchArchivedFacilities', payload)
    },
    async loadMoreArchivedFacilities(event:any){
      this.fetchArchivedFacilities(
        undefined,
        Math.ceil(
          this.archivedFacilities?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(() => {
        event.target.complete();
      });
    },
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