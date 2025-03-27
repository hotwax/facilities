<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Sell Online") }}</ion-list-header>
      <ion-item v-for="inventoryGroup in current.inventoryGroups" :key="inventoryGroup.facilityGroupId">
        {{ inventoryGroup?.facilityGroupName }}
        <ion-checkbox slot="end" :checked="inventoryGroup.isChecked" @click.prevent="updateSellInventoryOnlineSetting($event, inventoryGroup)" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonCheckbox,
  IonContent,
  IonItem,
  IonList,
  IonListHeader,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";
import { mapGetters, useStore } from "vuex";
import { hasError } from "@/adapter";
import { showToast } from "@/utils";
import { DateTime } from 'luxon';
import logger from "@/logger";
import emitter from '@/event-bus'
import { FacilityService } from "@/services/FacilityService";

export default defineComponent({
  name: "SellOnlineGroupPopover",
  components: {
    IonCheckbox,
    IonContent,
    IonItem,
    IonList,
    IonListHeader
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent'
    })
  },
  methods: {
    async updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
      event.stopImmediatePropagation();
      emitter.emit("presentLoader");

      // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
      const isChecked = !event.target.checked;

      try {
        let resp;
        let successMessage;
        if(isChecked) {
          resp = await FacilityService.addFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroup.facilityGroupId
          });
          successMessage = translate('is now selling on', { "facilityName": this.current.facilityName, "facilityGroupId": facilityGroup.facilityGroupName });
        } else {
          const groupInformation = this.current.groupInformation.find((group: any) => group.facilityGroupId === facilityGroup.facilityGroupId)
          resp = await FacilityService.updateFacilityToGroup({
            "facilityId": this.current.facilityId,
            "facilityGroupId": facilityGroup.facilityGroupId,
            "fromDate": groupInformation.fromDate,
            "thruDate": DateTime.now().toMillis()
          })
          successMessage = translate('no longer sells on', { "facilityName": this.current.facilityName, "facilityGroupId": facilityGroup.facilityGroupName })
        }
        if(!hasError(resp)) {
          showToast(successMessage)
          await this.store.dispatch('facility/fetchFacilityAdditionalInformation')
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update sell inventory online setting'))
        logger.error('Failed to update sell inventory online setting', err)
      }
      emitter.emit("dismissLoader");

      // Update the facility list to reflect the change in sell online status
      const hasAnyChecked = this.current.inventoryGroups.some((group: any) => group.isChecked);
      this.store.state.facilities = this.store.state.facility.facilities.list.map((facility: any) => {
        if (facility.facilityId === this.current.facilityId && hasAnyChecked !== facility.sellOnline) {
          facility.sellOnline = hasAnyChecked;
        }
        return facility;
      });
    },
  },
  setup() {
    const store = useStore();

    return {
      store,
      translate
    };
  }
});
</script>