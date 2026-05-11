<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()"> 
          <ion-icon :icon="closeOutline" slot="icon-only" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Group type") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <form @keyup.enter="saveGroupType()" class="ion-margin-top">
      <!-- Empty state -->
      <div class="empty-state" v-if="!facilityGroupTypes.length">
        <p>{{ translate("No group types found")}}</p>
      </div>

      <div v-else>
        <ion-radio-group v-model="facilityGroupValue.facilityGroupTypeId">
          <ion-item :key="groupType.facilityGroupTypeId" v-for="groupType in facilityGroupTypes">
            <ion-radio :value="groupType.facilityGroupTypeId">
              <ion-label>
                {{ groupType.description ? groupType.description : groupType.facilityGroupTypeId }}
                <p>{{ groupType.facilityGroupTypeId }}</p>
              </ion-label>
            </ion-radio>
          </ion-item>
        </ion-radio-group>
      </div>
    </form>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="!isGroupTypeUpdated()" @click="saveGroupType()">
        <ion-icon :icon="saveOutline" />
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
  IonItem,
  IonIcon,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonTitle,
  IonToolbar,
  modalController,
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@hotwax/dxp-components";
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { showToast } from "@/utils";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed } from "vue";

const props = defineProps(["facilityGroup"]);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);
const groups = computed(() => facilityStore.getFacilityGroups);

const facilityGroupValue = ref(JSON.parse(JSON.stringify(props.facilityGroup)));

function closeModal() {
  modalController.dismiss();
}

function isGroupTypeUpdated() {
  return props.facilityGroup.facilityGroupTypeId !== facilityGroupValue.value.facilityGroupTypeId;
}

async function saveGroupType() {
  try {
    const resp = await FacilityService.updateFacilityGroup({
      facilityGroupId: facilityGroupValue.value.facilityGroupId,
      facilityGroupTypeId: facilityGroupValue.value.facilityGroupTypeId
    });

    if (!hasError(resp)) {
      showToast(translate("Facility group type updated successfully."));
      const updatedGroups = groups.value.map((group: any) => {
        if (group.facilityGroupId === facilityGroupValue.value.facilityGroupId) {
          return {
            ...group,
            facilityGroupTypeId: facilityGroupValue.value.facilityGroupTypeId
          };
        }
        return group;
      });

      facilityStore.updateFacilityGroups(updatedGroups);
      modalController.dismiss();
    } else {
      throw resp.data;
    }
  } catch (err) {
    showToast(translate("Failed to update facility group type."));
    logger.error(err);
  }
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>