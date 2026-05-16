<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Sell Online") }}</ion-list-header>
      <ion-item v-for="inventoryGroup in associatedInventoryGroups" :key="inventoryGroup.facilityGroupId">
        <ion-checkbox label-placement="start" :checked="inventoryGroup.isChecked" @click.prevent="updateSellInventoryOnlineSetting($event, inventoryGroup)">
          {{ inventoryGroup?.facilityGroupName ? inventoryGroup.facilityGroupName : inventoryGroup.facilityGroupId }}
        </ion-checkbox>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { IonCheckbox, IonContent, IonItem, IonList, IonListHeader } from '@ionic/vue';
import { computed } from "vue";
import { translate } from "@common";
import { updateFacilityGroup } from "@/utils";
import emitter from '@/event-bus'
import { useUtilStore } from "@/store/util";

const props = defineProps(["facility"]);
const utilStore = useUtilStore();

const inventoryGroups = computed(() => utilStore.getInventoryGroups);

const associatedInventoryGroups = computed(() => {
  return inventoryGroups.value.map((group: any) => ({
    ...group,
    isChecked: props.facility.groupInformation?.some((facilityGroup: any) => facilityGroup?.facilityGroupId === group.facilityGroupId)
  }));
});

async function updateSellInventoryOnlineSetting(event: any, facilityGroup: any) {
  event.stopImmediatePropagation();
  emitter.emit("presentLoader");
  // Using `not` as the click event returns the current status of toggle, but on click we want to change the toggle status
  const isChecked = !event.target.checked;
  await updateFacilityGroup(props.facility, facilityGroup, isChecked);
  emitter.emit("dismissLoader");
}
</script>