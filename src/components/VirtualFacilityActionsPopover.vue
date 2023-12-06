<template>
  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ facility.facilityName }}
      </ion-list-header>
      <ion-item button @click="renameVirtualFacility()">
        {{ translate("Rename") }}
      </ion-item>
      <ion-item button @click="archiveVirtualFacility()">
        {{ translate("Archive") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>
  
<script lang="ts">
import {
  alertController,
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from '@hotwax/dxp-components'
import { showToast } from '@/utils';
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { mapGetters, useStore } from "vuex";
import logger from "@/logger";

export default defineComponent({
  name: "VirtualFacilityActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      virtualFacilities: 'facility/getVirtualFacilities',
    })
  },
  props: ['facility'],
  methods: {
    async renameVirtualFacility() {
      const alert = await alertController.create({
        header: translate('Rename parking'),
        inputs: [{
          name: "facilityName",
          value: this.facility.facilityName
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Apply'),
          handler: (data) => {
            const { facilityName } = data
            popoverController.dismiss(facilityName)
          }
        }]
      })
      await alert.present()
    },
    async archiveVirtualFacility() {
      try {
        let facilityGroupId = await this.fetchArchiveGroup()

        if (!facilityGroupId) {
          facilityGroupId = await this.createArchiveGroup()
        }
        
        if (!facilityGroupId) {
          throw { message: translate('Failed to archive parking.') }
        }

        const resp = await FacilityService.addFacilityToGroup({
          facilityId: this.facility.facilityId,
          facilityGroupId
        })

        if (!hasError(resp)) {
          const updatedVirtualFacilities = JSON.parse(JSON.stringify(this.virtualFacilities))
            .filter((facility: any) => facility.facilityId !== this.facility.facilityId)
          this.store.dispatch('facility/updateVirtualFacilities', updatedVirtualFacilities)
          await this.store.dispatch('facility/fetchArchivedFacilities')
          showToast(translate("Parking archived successfully."))
        } else {
          throw resp.data
        }
      } catch (error: any) {
        showToast(error.message)
        logger.error(error.message)
      }

      popoverController.dismiss()
    },
    async fetchArchiveGroup() {
      let fetchedFacilityGroupId = ''
      try {
        const resp = await FacilityService.fetchFacilityGroup({
          inputFields: {
            facilityGroupId: 'ARCHIVE',
          },
          entityName: 'FacilityGroup',
          viewSize: 1
        })

        fetchedFacilityGroupId = resp.data.count ? resp.data.docs[0].facilityGroupId : ''
      } catch (error) {
        logger.error(error)
        showToast(translate('Something went wrong.'))
      }
      return fetchedFacilityGroupId
    },
    async createArchiveGroup() {
      let createdFacilityGroupId = ''
      try {
        const resp = await FacilityService.createFacilityGroup({
          facilityGroupName: 'Archive',
          facilityGroupId: 'ARCHIVE',
          facilityGroupTypeId: '', // TODO need to decide group type ID
        })

        if (!hasError(resp)) {
          createdFacilityGroupId = resp.data.facilityGroupId
        } else {
          throw { message: translate('Failed to archive parking.') }
        }

        return Promise.resolve(createdFacilityGroupId)
      } catch (error) {
        return Promise.reject(error);
      }
    }
  },
  setup() {
    const store = useStore();

    return {
      store,
      translate
    }
  },
});
</script>