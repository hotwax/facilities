<template>
  <ion-content>
    <ion-list>
      <ion-list-header>
        {{ group.facilityGroupName }}
      </ion-list-header>
      <ion-item button @click="viewFacilities(group.facilityGroupId)">
        {{ translate("View facilities") }}
        <ion-icon :icon="openOutline" color="primary" slot="end" />
      </ion-item>
      <ion-item button lines="none" @click="openAddFacilityToGroupsModal(group)">
        {{ translate("Quick edit") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonListHeader,
  modalController,
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from "vuex";
import { openOutline } from 'ionicons/icons'
import AddFacilityToGroupsModal from '@/components/AddFacilityToGroupModal.vue'

export default defineComponent({
  name: "AddFacilityActionsPopover",
  components: {
    IonContent,
    IonIcon,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      groups: 'facility/getFacilityGroups',
      facilityQuery: "facility/getFacilityQuery",
    })
  },
  props: ['group'],
  methods: {
    async viewFacilities(facilityGroupId: string) {
      await this.store.dispatch('facility/updateFacilityQuery', { ...this.facilityQuery, facilityGroupId })
      this.$router.push({ path: `/find-facilities` })
      popoverController.dismiss()
    },
    async openAddFacilityToGroupsModal(group: any) {
      const modal = await modalController.create({
        component: AddFacilityToGroupsModal,
        componentProps: { group }
      })

      modal.onDidDismiss().then(() =>{
        popoverController.dismiss()
      })
      modal.present()
    },
  },
  setup() {
    const store = useStore();

    return {
      openOutline,
      store,
      translate
    }
  },
});
</script>