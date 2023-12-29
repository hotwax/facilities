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
      <ion-item button lines="none">
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
  popoverController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from "vuex";
import { openOutline } from 'ionicons/icons'

export default defineComponent({
  name: "FacilityGroupActionsPopover",
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