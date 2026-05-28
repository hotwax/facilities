<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate('Edit group detail') }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-input label-placement="floating" v-model="facilityGroupName">
        <div slot="label">{{ translate("Name") }} <ion-text color="danger">*</ion-text></div>
      </ion-input>
    </ion-item>
    <ion-item lines="none">
      <ion-textarea :label="translate('Description')" label-placement="floating"
        :placeholder="translate('group description')"
        :auto-grow="true"
        :counter="true" 
        :maxlength="255"
        v-model="facilityGroupDescription"
      >
      </ion-textarea>
    </ion-item>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="updateFacilityGroupDescription()">
        <ion-icon :icon="lockClosedOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script setup lang="ts">
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { translate } from "@common"
import { commonUtil } from '@common';
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { ref, computed } from "vue";

const props = defineProps(['facilityGroup']);
const facilityStore = useFacilityStore();
const groups = computed(() => facilityStore.getFacilityGroups);

const facilityGroupName = ref(props.facilityGroup.facilityGroupName || '');
const facilityGroupDescription = ref(props.facilityGroup.description || '');

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

async function updateFacilityGroupDescription() {
  if (facilityGroupName.value.trim().length <= 0) {
    commonUtil.showToast(translate('Facility group name cannot be empty'));
    return false;    
  }
  emitter.emit('presentLoader');
  try {
    const resp = await facilityStore.updateFacilityGroup({
      facilityGroupId: props.facilityGroup.facilityGroupId,
      facilityGroupName: facilityGroupName.value,
      description: facilityGroupDescription.value
    });
    if (!commonUtil.hasError(resp)) {
      commonUtil.showToast(translate('Group detail updated.'));
      const updatedGroups = groups.value.map((groupData: any) => {
        if (props.facilityGroup.facilityGroupId === groupData.facilityGroupId) {
          return {
            ...groupData,
            facilityGroupName: facilityGroupName.value,
            description: facilityGroupDescription.value
          };
        }
        return groupData;
      });
      facilityStore.updateFacilityGroups(updatedGroups);
    }
  } catch (error) {
    commonUtil.showToast(translate('Failed to update group detail.'));
  }
  closeModal();
  emitter.emit('dismissLoader');
}
</script>