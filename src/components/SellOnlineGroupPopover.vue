<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Sell Online") }}</ion-list-header>
      <ion-item v-for="inventoryGroup in getAssociatedInventoryGroups()" :key="inventoryGroup.facilityGroupId">
        <ion-checkbox label-placement="start" :checked="inventoryGroup.isChecked" @click.prevent="updateSellInventoryOnlineSetting($event, inventoryGroup)">
          {{ inventoryGroup?.facilityGroupName ? inventoryGroup.facilityGroupName : inventoryGroup.facilityGroupId }}
        </ion-checkbox>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { IonCheckbox, IonContent, IonItem, IonList, IonListHeader } from '@ionic/vue';
import { computed, defineProps, ref } from "vue"
import { translate } from "@hotwax/dxp-components";
import { updateFacilityGroup } from "@/utils";
import emitter from '@/event-bus'
import store from "@/store";

const props = defineProps(["facility"]);
let currentFacility = ref(props.facility);

const inventoryGroups = computed(() => store.getters['util/getInventoryGroups'])

function getAssociatedInventoryGroups() {
  inventoryGroups.value.forEach((group: any) => {
    group.isChecked = (currentFacility.value.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId));
  });
  return inventoryGroups.value;
}

async function updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");
  // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
  const isChecked = !event.target.checked;
  await updateFacilityGroup(currentFacility.value, facilityGroup, isChecked);
  emitter.emit("dismissLoader");
}
</script>