<template>
  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ group.facilityGroupName }}
      </ion-list-header>
      <ion-item button @click="renameFacilityGroup()">
        {{ translate("Rename") }}
      </ion-item>
      <ion-item button @click="updateGroupDescriptionModal()">
        {{ group?.description ? translate("Edit description") : translate("Add description") }}
      </ion-item>
      <ion-item button @click="updateGroupTypeModal()">
        {{ translate("Select type") }}
      </ion-item>
      <ion-item button @click="deleteFacilityGroup()" lines="none">
        {{ translate("Delete") }}
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
  popoverController,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from '@hotwax/dxp-components'
import { showToast } from '@/utils';
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import { mapGetters, useStore } from "vuex";
import { DateTime } from 'luxon';
import logger from "@/logger";
import FacilityGroupDescriptionModal from "@/components/FacilityGroupDescriptionModal.vue";
import GroupTypeModal from "@/components/GroupTypeModal.vue";

export default defineComponent({
  name: "FacilityGroupActionsPopover",
  components: {
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      groups: 'facility/getFacilityGroups',
    })
  },
  props: ['group'],
  methods: {
    async renameFacilityGroup() {
      const alert = await alertController.create({
        header: translate('Rename group'),
        inputs: [{
          name: "facilityGroupName",
          value: this.group.facilityGroupName
        }],
        buttons: [{
          text: translate('Cancel'),
          role: "cancel"
        },
        {
          text: translate('Apply'),
          handler: (data) => {
            const { facilityGroupName } = data
            if (facilityGroupName.length <= 0) {
              showToast(translate('Please enter a group name'));
              return false;    
            }
            popoverController.dismiss(facilityGroupName)
          }
        }]
      })
      await alert.present()
    },
    async updateGroupDescriptionModal() {
      const facilityLoginModal = await modalController.create({
        component: FacilityGroupDescriptionModal,
        componentProps: { facilityGroup: this.group }
      })
      facilityLoginModal.present()
    },
    async deleteFacilityGroup() {
      if (this.group.facilityCount) {
        const linkFacilitiesAlert = await alertController.create({
          header: translate('Linked facilities'),
          message: translate('This group has facilities linked to it as members or they’re using this facility as a primary brand group. Unlink all references for this group to delete this group.', { lineSpacing: '<br /><br />' }),
          buttons: [translate('Dismiss')],
        })

        popoverController.dismiss()
        await linkFacilitiesAlert.present()
        return
      }

      try {
        //First delete all the Inactive FacilityGroupMember records
        await this.deleteInactiveFacilityGroupAssociations(this.group.facilityGroupId);
        const resp = await FacilityService.updateFacilityGroup({
          facilityGroupId: this.group.facilityGroupId,
          thruDate: DateTime.now().toMillis()
        }) as any

        if (!hasError(resp)) {
          showToast(translate('Facility group deleted.'))
          const updatedFacilityGroups = JSON.parse(JSON.stringify(this.groups))
            .filter((group: any) => group.facilityGroupId !== this.group.facilityGroupId)
          this.store.dispatch('facility/updateFacilityGroups', updatedFacilityGroups)
        } else {
          throw resp.data
        }
      } catch (error) {
        showToast(translate('Failed to delete facility group.'))
        logger.error('Failed to delete facility group.', error)
      }
      popoverController.dismiss()
    },
    async deleteInactiveFacilityGroupAssociations(groupId: string) {
      const members = await FacilityService.fetchInactiveFacilityGroupAssociations(groupId);
      let promises = [] as any;
      members.forEach((member:any) => {
        promises.push(FacilityService.removeFacilityFromGroup({
          facilityGroupId: member.facilityGroupId,
          facilityId: member.facilityId,
          fromDate: member.fromDate
        }));
      });
      await Promise.all(promises).then(responses => {
        responses.forEach(response => {
          if (hasError(response)) {
            throw response.data;
          }
        });
      })
    },
    async updateGroupTypeModal() {
      const updateGroupTypeModal = await modalController.create({
        component: GroupTypeModal,
        componentProps: { facilityGroup: this.group }
      })

      await popoverController.dismiss()
      updateGroupTypeModal.present()
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