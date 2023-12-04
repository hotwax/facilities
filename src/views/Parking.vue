<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/"/>
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
        <section>
          <div class="virtual-facilities">
            <ion-card v-for="(facility, index) in virtualFacilities" :key="index">
              <ion-item lines="full">
                <ion-label>
                  {{ facility.facilityName }}
                  <p>{{ facility.facilityId }}</p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="medium" @click="openVirtualFacilityActionsPopover($event, facility)">
                  <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
                </ion-button>
              </ion-item>
              <template v-if="facility.facilityId === '_NA_'">
                <ion-item lines="full">
                  <ion-label>{{ translate('Pending allocation') }}</ion-label>
                  <ion-note slot="end">{{ facility.orderCount }}</ion-note>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ translate('Next brokering') }}</ion-label>
                  <ion-note slot="end">{{ facility?.brokeringJob?.runTime && getDateTime(facility.brokeringJob.runTime) }}</ion-note>
                </ion-item>
              </template>
              <ion-item v-else>
                <ion-label>{{ translate('Orders') }}</ion-label>
                <ion-note slot="end">{{ facility.orderCount }}</ion-note>
              </ion-item>
              <ion-item lines="full" v-if="['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId)">
                <ion-label>{{ translate('Auto release') }}</ion-label>
                <ion-toggle :checked="facility.autoReleaseJob" :disabled="true" slot="end" />
              </ion-item>
              <ion-item lines="full" v-if="facility.description && !['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId) && facility.facilityId !== '_NA_'">
                <ion-label>{{ facility.description }}</ion-label>
              </ion-item>
            </ion-card> 
            <ion-card>
              <ion-button color="medium" fill="clear" @click="openAddVirtualFacilityModal()">
                <ion-icon :icon="addOutline" slot="start"/>
                {{ translate('Add new parking') }}
              </ion-button>
            </ion-card>
          </div>   
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonContent,
  IonHeader, 
  IonIcon,
  IonItem,
  IonLabel,
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
import AddVirtualFacilityModal from '@/components/AddVirtualFacilityModal.vue';
import VirtualFacilityActionsPopover from '@/components/VirtualFacilityActionsPopover.vue';
import ArchivedFacilityModal from '@/components/ArchivedFacilityModal.vue';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import { showToast } from '@/utils';

export default defineComponent({
  name: 'Parking',
  components: {
    IonBackButton,
    IonButton,
    IonButtons,
    IonCard,
    IonContent,
    IonHeader, 
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      virtualFacilities: 'facility/getVirtualFacilities',
    })
  },
  async ionViewWillEnter() {
    await this.store.dispatch('facility/fetchVirtualFacilities')
  },
  methods: {
    getDateTime(time: any) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
    },
    async openAddVirtualFacilityModal() {
      const addVirtualFacility = await modalController.create({
        component: AddVirtualFacilityModal
      })

      addVirtualFacility.present()
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
          showToast(translate('Parking name updated.'))
        } else {
          throw resp.data
        }
      }
    },
    async openArchivedFacilityModal() {
      const archivedFacilityModal = await modalController.create({
        component: ArchivedFacilityModal
      })

      archivedFacilityModal.present()
    }
  },
  setup() {
    const store = useStore();

    return {
      addOutline,
      archiveOutline,
      ellipsisVerticalOutline,
      store,
      translate
    }
  }
});
</script>

<style scoped>
.virtual-facilities {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start; 
}
</style>