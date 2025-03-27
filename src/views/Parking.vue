<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ translate("Parking") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openArchivedFacilityModal()">
            <ion-icon slot="icon-only" :icon="archiveOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <!-- custom sorting in the UI to keep BACKORDER_PARKING, PRE_ORDER_PARKING and _NA_ types first -->
        <ion-card v-for="(facility, index) in customSort(virtualFacilities, ['BACKORDER_PARKING', 'PRE_ORDER_PARKING', '_NA_'], 'facilityId')" :key="index">
          <ion-item lines="full">
            <ion-label>
              <h1>{{ facility.facilityName }}</h1>
              <p>{{ facility.facilityId }}</p>
            </ion-label>
            <ion-button fill="clear" color="medium" @click="openVirtualFacilityActionsPopover($event, facility)">
              <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
            </ion-button>
          </ion-item>
          <template v-if="facility.facilityId === '_NA_'">
            <ion-item>
              <ion-label>{{ translate('Pending allocation') }}</ion-label>
              <ion-note slot="end">{{ facility.orderCount }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>{{ translate('Next brokering') }}</ion-label>
              <ion-note slot="end">{{ facility?.brokeringJob?.runTime ? getDateTime(facility?.brokeringJob?.runTime) : translate("Not scheduled") }}</ion-note>
            </ion-item>
          </template>
          <ion-item v-else :lines="(isFacilityDescriptionAvailable(facility) || ['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId)) ? '' : 'none'">
            <ion-label>{{ translate('Orders') }}</ion-label>
            <ion-note slot="end">{{ facility.orderCount }}</ion-note>
          </ion-item>
          <ion-item :lines="isFacilityDescriptionAvailable(facility) ? 'inset' : 'none'" v-if="['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId)">
            <ion-toggle :checked="facility.autoReleaseJob" :disabled="true">{{ translate('Auto release') }}</ion-toggle>
          </ion-item>
          <ion-item lines="none" v-if="isFacilityDescriptionAvailable(facility)">
            <ion-label>{{ facility.description }}</ion-label>
          </ion-item>
        </ion-card>
      </main>
      <ion-infinite-scroll
        @ionInfinite="loadMoreFacilities($event)"
        threshold="100px"
        :disabled="!isScrollable"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openCreateVirtualFacilityModal()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader, 
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
  modalController,
  popoverController,
} from '@ionic/vue'
import { addOutline, archiveOutline, ellipsisVerticalOutline } from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components';
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';
import CreateVirtualFacilityModal from '@/components/CreateVirtualFacilityModal.vue';
import VirtualFacilityActionsPopover from '@/components/VirtualFacilityActionsPopover.vue';
import ArchivedFacilityModal from '@/components/ArchivedFacilityModal.vue';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import { customSort, showToast } from '@/utils';
import logger from "@/logger";

export default defineComponent({
  name: 'Parking',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader, 
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      virtualFacilities: 'facility/getVirtualFacilities',
      isScrollable: "facility/isVirtualFacilitiesScrollable",
    })
  },
  async ionViewWillEnter() {
    await this.fetchFacilities();
  },
  methods: {
    getDateTime(time: any) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
    },
    async openCreateVirtualFacilityModal() {
      const createVirtualFacility = await modalController.create({
        component: CreateVirtualFacilityModal
      })

      createVirtualFacility.present()
    },
    async openVirtualFacilityActionsPopover(event: Event, facility: any) {
      const parkingActionsPopover = await popoverController.create({
        component: VirtualFacilityActionsPopover,
        event,
        showBackdrop: false,
        componentProps: { facility }
      });

      parkingActionsPopover.present();

      const result = await parkingActionsPopover.onDidDismiss();
      if (result.data && result.data !== facility.facilityName) {
        try {
          const resp = await FacilityService.updateFacility({
            facilityId: facility.facilityId,
            facilityName: result.data
          })

          if (!hasError(resp)) {
            const updatedVirtualFacilities = JSON.parse(JSON.stringify(this.virtualFacilities))
              .map((facilityData: any) => {
                if (facility.facilityId === facilityData.facilityId) {
                  facilityData.facilityName = result.data
                }

                return facilityData
              })
            this.store.dispatch('facility/updateVirtualFacilities', updatedVirtualFacilities)
            showToast(translate('Parking renamed successfully.'))
          } else {
            throw resp.data
          }
        } catch (error) {
          showToast(translate('Failed to rename parking.'))
          logger.error('Failed to rename parking.', error)
        }
      }
    },
    async openArchivedFacilityModal() {
      const archivedFacilityModal = await modalController.create({
        component: ArchivedFacilityModal
      })

      archivedFacilityModal.present()
    },
    async fetchFacilities(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchVirtualFacilities', payload)
    },
    async loadMoreFacilities(event: any) {
      this.fetchFacilities(
        undefined,
        Math.ceil(
          this.virtualFacilities?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(() => {
        event.target.complete();
      });
    },
    isFacilityDescriptionAvailable(facility: any) {
      return facility.description && !['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId) && facility.facilityId !== '_NA_';
    }
  },
  setup() {
    const store = useStore();

    return {
      addOutline,
      archiveOutline,
      customSort,
      ellipsisVerticalOutline,
      store,
      translate
    }
  }
});
</script>

<style scoped>

main {
  display: grid;
  place-content: center;
  grid-template-columns: repeat(auto-fill, minmax(300px, 343px));
  max-width: 1000px;
  margin: auto;
  align-items: start;
}

@media screen and (min-width: 991px) {
  ion-content {
    --padding-bottom: 80px;
  }
}

</style>