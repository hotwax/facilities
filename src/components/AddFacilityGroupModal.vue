<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Add Group") }}</ion-title>
    </ion-toolbar>
    <ion-toolbar>
      <ion-searchbar v-model="queryString" @keyup.enter="queryString = $event.target.value; findGroups()" @ionClear="queryString = ''; findGroups()"/>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <div class="empty-state" v-if="!Object.keys(filteredFacilityGroupsByType).length || isSearching">
      <p>{{ translate("No facility groups found") }}</p>
    </div>
    <form v-else @keyup.enter="updateGroups">
      <ion-list>
        <ion-item-group v-for="(groups, typeId) in filteredFacilityGroupsByType" :key="typeId">
          <ion-item-divider color="light">{{ getFacilityGroupTypeDesc(typeId) }}</ion-item-divider>
          <ion-item v-for="group in groups" :key="group.facilityGroupId">
            <ion-checkbox :checked="isFacilityGroupLinked(group.facilityGroupId)" @ion-change="updateGroupsForFacility(group.facilityGroupId)">{{ group.facilityGroupName }}</ion-checkbox>
          </ion-item>
        </ion-item-group>
      </ion-list>
    </form>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="updateGroups">
        <ion-icon :icon="saveOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonList,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { commonUtil, translate } from "@common"
import { FacilityService } from "@/services/FacilityService";
import logger from "@/logger";
import emitter from "@/event-bus";
import { DateTime } from "luxon";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed, onMounted } from "vue";

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const current = computed(() => facilityStore.getCurrent);
const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);

const facilityGroupsByType = ref({} as any);
const filteredFacilityGroupsByType = ref({} as any);
const groupsToAdd = ref([] as Array<string>);
const groupsToRemove = ref([] as Array<string>);
const queryString = ref('');
const isSearching = ref(false);

onMounted(async () => {
  await fetchFacilityGroups();
});

function closeModal(fetchGroups = false) {
  modalController.dismiss({ fetchGroups });
}

function updateGroupsForFacility(facilityGroupId: string) {
  // if clicked on an already added group
  if (isFacilityGroupLinked(facilityGroupId)) {
    if (groupsToRemove.value.includes(facilityGroupId)) {
      groupsToRemove.value.splice(groupsToRemove.value.indexOf(facilityGroupId), 1);
    } else {
      groupsToRemove.value.push(facilityGroupId);
    }
    return;
  }

  if (groupsToAdd.value.includes(facilityGroupId)) {
    groupsToAdd.value.splice(groupsToAdd.value.indexOf(facilityGroupId), 1);
  } else {
    groupsToAdd.value.push(facilityGroupId);
  }
}

async function updateGroups() {
  if (!groupsToAdd.value.length && !groupsToRemove.value.length) {
    commonUtil.showToast(translate('Please select/de-select groups to link/unlink from facility'));
    return;
  }

  emitter.emit("presentLoader");

  let isFacilityGroupRespHasError = false;

  for (const groupId of groupsToAdd.value) {
    try {
      await addFacilityToGroup(groupId);
    } catch {
      isFacilityGroupRespHasError = true;
    }
  }

  for (const groupId of groupsToRemove.value) {
    try {
      await removeFacilityFromGroup(groupId);
    } catch {
      isFacilityGroupRespHasError = true;
    }
  }

  if (isFacilityGroupRespHasError) {
    commonUtil.showToast(translate('Failed to update some groups for facility'));
  } else {
    commonUtil.showToast(translate('Updated groups for facility'));
  }
  emitter.emit("dismissLoader");
  closeModal(true);
}

async function addFacilityToGroup(facilityGroupId: string) {
  try {
    const resp = await FacilityService.addFacilityToGroup({
      "facilityId": current.value.facilityId,
      "facilityGroupId": facilityGroupId
    });

    if (commonUtil.hasError(resp)) {
      throw resp.data;
    }
    return Promise.resolve(resp.data);
  } catch (err) {
    logger.error('Failed to add group to facility', err);
    return Promise.reject(err);
  }
}

async function removeFacilityFromGroup(facilityGroupId: string) {
  const groupInformation = current.value.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId);

  try {
    const resp = await FacilityService.updateFacilityToGroup({
      "facilityId": current.value.facilityId,
      "facilityGroupId": facilityGroupId,
      "fromDate": groupInformation.fromDate,
      "thruDate": DateTime.now().toMillis()
    });

    if (commonUtil.hasError(resp)) {
      throw resp.data;
    }
    return Promise.resolve(resp.data);
  } catch (err) {
    logger.error('Failed to remove group from facility', err);
    return Promise.reject(err);
  }
}

async function fetchFacilityGroups() {
  let viewIndex = 0, resp;

  try {
    do {
      const params = {
        entityName: "FacilityGroup",
        noConditionFind: 'Y',
        orderBy: "facilityGroupTypeId ASC",
        fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
        viewSize: 250,
        viewIndex
      };
      resp = await FacilityService.fetchFacilityGroups(params);

      if (!commonUtil.hasError(resp) && resp.data?.docs?.length > 0) {
        const newFacilityGroups = resp.data.docs.reduce((groupsByType: any, group: any) => {
          const groupTypeId = !group.facilityGroupTypeId ? "Others" : group.facilityGroupTypeId;

          if (groupsByType[groupTypeId]) {
            groupsByType[groupTypeId].push(group);
          } else {
            groupsByType[groupTypeId] = [group];
          }
          return groupsByType;
        }, {});
        facilityGroupsByType.value = { ...facilityGroupsByType.value, ...newFacilityGroups };
        filteredFacilityGroupsByType.value = facilityGroupsByType.value;
      } else {
        throw resp.data;
      }
      viewIndex++;
    } while (resp.data.docs.length >= 250);
  } catch (err) {
    logger.error('Failed to find facility groups', err);
  }
}

function isFacilityGroupLinked(facilityGroupId: string) {
  return current.value.groupInformation?.some((group: any) => group.facilityGroupId === facilityGroupId);
}

function findGroups() {
  isSearching.value = true;
  if (!queryString.value.trim()) {
    filteredFacilityGroupsByType.value = facilityGroupsByType.value;
    isSearching.value = false;
    return;
  }

  const keyword = queryString.value.trim().toLowerCase();

  filteredFacilityGroupsByType.value = Object.values(facilityGroupsByType.value).reduce((filteredGroups: any, groups: any) => {
    groups.map((group: any) => {
      const groupId = group.facilityGroupId ? group.facilityGroupId.toLowerCase() : '';
      const groupName = group.facilityGroupName ? group.facilityGroupName.toLowerCase() : '';

      if (groupId.includes(keyword) || groupName.includes(keyword)) {
        const groupTypeId = group?.facilityGroupTypeId || "Others";
        if (filteredGroups[groupTypeId]) {
          filteredGroups[groupTypeId].push(group);
        } else {
          filteredGroups[groupTypeId] = [group];
        }
      }
    });
    return filteredGroups;
  }, {});

  isSearching.value = false;
}

function getFacilityGroupTypeDesc(groupTypeId: any) {
  return facilityGroupTypes.value.find((groupType: any) => groupType.facilityGroupTypeId === groupTypeId)?.description || groupTypeId;
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>
