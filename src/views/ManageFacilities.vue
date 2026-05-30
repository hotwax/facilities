<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button default-href="/tabs/find-groups" slot="start" />
        <ion-title>{{ translate("Manage Facilities") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
        <section class="ion-padding-end search">
          <ion-searchbar :placeholder="translate('Search facilities')" v-model="queryString" @ionInput="getFilteredFacilities()"/>
          <ion-list>
            <ion-list-header>
              <ion-label>{{ translate('Results') }} : {{ filteredFacilities?.length }}</ion-label>
              <ion-button fill="clear" @click="selectAll" :disabled="!filteredFacilities.length">
                {{ translate('Include all') }}
                <ion-icon :icon="arrowForwardOutline"/>
              </ion-button>
            </ion-list-header>
            <ion-item v-for="facility in filteredFacilities" :key="facility.facilityId">
              <ion-label >
                <p>{{ facility.facilityId }}</p>
                {{ facility.facilityName }}
              </ion-label>
              <ion-button slot="end" fill="clear" size="default" color="success" @click="selectFacility(facility)">
                <ion-icon :icon="addCircleOutline" slot="icon-only"/>
              </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-label v-if="!filteredFacilities.length">{{ translate('No facilities available to select') }}</ion-label>
            </ion-item>
          </ion-list>
        </section>

        <main v-if="selectedFacilities.length">
          <h3 class="ion-margin-start">{{ translate('Total facilities selected for group', {total: selectedFacilities.length, facilityGroupName: currentFacilityGroup.facilityGroupName ? currentFacilityGroup.facilityGroupName : props.facilityGroupId}) }}</h3>
          <ion-list>
            <ion-list-header>
              <ion-label>{{ translate('Manage sequence') }}</ion-label>
            </ion-list-header>
            <ion-reorder-group @ionItemReorder="doReorder($event)" :disabled="false">
              <ion-item v-for="facility in selectedFacilities" :key="facility.facilityId">
                <ion-button slot="start" fill="clear" size="default" color="danger" @click="removeFacility(facility)">
                  <ion-icon :icon="removeCircleOutline" slot="icon-only"/>
                </ion-button>
                <ion-label>
                  <p>{{ facility.facilityId }}</p>
                  {{ facility.facilityName }}
                </ion-label>
                <ion-reorder slot="end"/>
              </ion-item>
            </ion-reorder-group>
          </ion-list> 
        </main>
        <main v-else>
          <p class="empty-state"> {{ translate('No facilities selected.') }}</p>
        </main>
      </div>
      
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button :disabled="!isFacilityMembersModified" @click="save()">
          <ion-icon :icon="saveOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonBackButton,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonReorder,
  IonReorderGroup,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  alertController,
  onIonViewWillEnter
} from '@ionic/vue';
import { ref } from 'vue';
import { addCircleOutline, arrowForwardOutline, removeCircleOutline, saveOutline } from 'ionicons/icons';
import { onBeforeRouteLeave } from 'vue-router';
import { commonUtil, translate } from "@common"
import logger from '@/logger';
import { DateTime } from "luxon";
import emitter from "@/event-bus";
import router from '@/router';
import { useFacilityStore } from '@/store';

const props = defineProps(['facilityGroupId']);

const queryString = ref('');
const facilities = ref([] as any[]);
const filteredFacilities = ref([] as any[]);
const memberFacilities = ref([] as any[]);
const selectedFacilities = ref([] as any[]);
const currentFacilityGroup = ref({} as any);
const isFacilityMembersModified = ref(false);
const isSavingDetail = ref(false);

onIonViewWillEnter(async () => {
  emitter.emit('presentLoader');
  isSavingDetail.value = false;
  queryString.value = '';
  await Promise.all([fetchFacilities(), fetchFacilityGroup()]);
  await fetchMemberFacilities();
  getFilteredFacilities();
  emitter.emit('dismissLoader');
});

onBeforeRouteLeave(async () => {
  if (isSavingDetail.value || !isFacilityMembersModified.value) return true;

  let canLeave = false;
  const alert = await alertController.create({
    header: translate("Leave page"),
    message: translate("Any edits made on this page will be lost."),
    buttons: [
      {
        text: translate("STAY"),
        handler: () => {
          canLeave = false;
        },
      },
      {
        text: translate("LEAVE"),
        handler: () => {
          canLeave = true;
        },
      },
    ],
  });

  await alert.present();
  await alert.onDidDismiss();
  return canLeave;
});

function getFilteredFacilities() {
  let nonMemberFacilities = facilities.value ? [...facilities.value] : [] as any;
  const selectedFacilityIds = new Set(selectedFacilities.value.map((facility: any) => facility.facilityId));
  nonMemberFacilities = facilities.value.filter((facility: any) => !selectedFacilityIds.has(facility.facilityId));
  if (queryString.value) {
    nonMemberFacilities = nonMemberFacilities.filter((facility: any) => (facility.facilityId.toLowerCase().includes(queryString.value.toLowerCase())) || (facility.facilityName && facility.facilityName.toLowerCase().includes(queryString.value.toLowerCase())));
  }
  filteredFacilities.value = nonMemberFacilities;
}

async function fetchFacilityGroup() {

  try {
    const resp = await useFacilityStore().fetchFacilityGroups({ facilityGroupId: props.facilityGroupId });

      if (resp.data?.length > 0) {
      currentFacilityGroup.value = resp.data[0];
    } else {
      throw resp.data;
    }
  } catch(err) {
    logger.error('Failed to fetch facility group', err);
  }
}

async function fetchFacilities() {
  facilities.value = [];
  try {
    const resp = await useFacilityStore().fetchAllFacilities() as any;
    if (!commonUtil.hasError(resp) && resp.data?.length) {
      facilities.value = resp.data;
    } else {
      throw resp.data;
    }
  } catch (error) {
    logger.error(error);
  }
}

async function fetchMemberFacilities() {
  memberFacilities.value = [];
  let viewIndex = 0, resp;

  try {
    const facilityDetail = facilities.value.reduce((facilityInfo: any, facility: any) => {
      facilityInfo[facility.facilityId] = facility;
      return facilityInfo;
    }, {});

    const resp = await useFacilityStore().fetchAssociatedFacilitiesToGroup({
      customParametersMap: {
        facilityGroupId: props.facilityGroupId,
        orderByField: "sequenceNum",
        pageNoLimit: true
      },
      filterByDate: true,
      fieldsToSelect: "facilityGroupId,facilityId,fromDate,sequenceNum",
    }) as any;

    if (!commonUtil.hasError(resp) && resp.data?.entityValueList?.length) {
      memberFacilities.value = resp.data.entityValueList.map((memberFacility: any) => {
        const facility = facilityDetail[memberFacility.facilityId];
        if (facility) {
          memberFacility.facilityName = facility.facilityName;
        }
        return memberFacility;
      });
    } else {
      throw resp.data;
    }
    selectedFacilities.value = JSON.parse(JSON.stringify(memberFacilities.value));
  } catch (error) {
    logger.error(error);
  }
}

function selectFacility(facility: any) {
  let sequenceNum = 1;
  if (selectedFacilities.value.length > 0) {
    sequenceNum = selectedFacilities.value[selectedFacilities.value.length - 1].sequenceNum;
  }
  sequenceNum = sequenceNum ? sequenceNum + 1 : 1;
  selectedFacilities.value = [...selectedFacilities.value, {...facility, sequenceNum}];
  getFilteredFacilities();
  isFacilityMembersModified.value = true;
}

function selectAll() {
  let sequenceNum = 1;
  if (selectedFacilities.value.length > 0) {
    sequenceNum = selectedFacilities.value[selectedFacilities.value.length - 1].sequenceNum;
  }
  sequenceNum = sequenceNum ? sequenceNum + 1 : 1;

  const facilitiesWithSequences = filteredFacilities.value.map((facility: any, index: any) => {
    facility.sequenceNum = sequenceNum + index;
    return facility;
  });
  
  selectedFacilities.value = [...selectedFacilities.value, ...facilitiesWithSequences];
  getFilteredFacilities();
  isFacilityMembersModified.value = true;
}

function removeFacility(facility: any) {
  selectedFacilities.value = selectedFacilities.value.filter((selectedFacility: any) => selectedFacility.facilityId !== facility.facilityId);
  getFilteredFacilities();
  isFacilityMembersModified.value = true;
}

async function save() {
  isSavingDetail.value = true;
  const memberFacilityIds = memberFacilities.value.map((facility: any) => facility.facilityId);
  const facilitiesToAdd = selectedFacilities.value.filter((facility: any) => !memberFacilityIds.includes(facility.facilityId));
  const selectedFacilityIds = new Set(selectedFacilities.value.map((facility: any) => facility.facilityId));
  const facilitiesToRemove = memberFacilities.value.filter((facility: any) => !selectedFacilityIds.has(facility.facilityId));
  
  const facilitiesToRemoveList = facilitiesToRemove.map((facility: any) => ({
    "facilityGroupId": props.facilityGroupId,
    "facilityId": facility.facilityId,
    "fromDate": facility.fromDate,
    "thruDate": DateTime.now().toMillis()
  }));
  
  const facilitiesToAddList = facilitiesToAdd.map((facility: any) => ({
    "facilityGroupId": props.facilityGroupId,
    "facilityId": facility.facilityId,
    "sequenceNum": facility.sequenceNum
  }));
  
  const facilityIdsToAdd = new Set(facilitiesToAdd.map((facility: any) => facility.facilityId));
  const existingFacilityMembers = selectedFacilities.value.filter((facility: any) => !facilityIdsToAdd.has(facility.facilityId));
  const diffMemberFacilitySequencing = existingFacilityMembers.filter((facility: any) => memberFacilities.value.some((memberFacility: any) => memberFacility.facilityId === facility.facilityId && memberFacility.sequenceNum !== facility.sequenceNum));

  const memberFacilityDetail = memberFacilities.value.reduce((memberInfo: any, facility: any) => {
    memberInfo[facility.facilityId] = facility;
    return memberInfo;
  }, {});

  const diffMemberFacilitySequencingList = diffMemberFacilitySequencing.map((memberFacility: any) => ({
    "facilityGroupId": props.facilityGroupId,
    "facilityId": memberFacility.facilityId,
    "fromDate": memberFacilityDetail[memberFacility.facilityId].fromDate,
    "sequenceNum": memberFacility.sequenceNum
  }));

  const facilitiesToUpdateList = [...facilitiesToRemoveList, ...diffMemberFacilitySequencingList];
  const requestPayload = [];

  if (facilitiesToUpdateList.length > 0) {
    requestPayload.push(useFacilityStore().updateFacilitiesToGroup({ facilityList: facilitiesToUpdateList }));
  }

  if (facilitiesToAddList.length > 0) {
    requestPayload.push(useFacilityStore().addFacilitiesToGroup({ facilityList: facilitiesToAddList }));
  }

  const responses = await Promise.allSettled(requestPayload);
  const hasFailedResponse = responses.some((response: any) => response.status === 'rejected');

  if (hasFailedResponse) {
    commonUtil.showToast(translate("Failed to update some member facilities."));
  } else {
    commonUtil.showToast(translate("Member facilities updated successfully."));
  }
  
  isFacilityMembersModified.value = false;
  router.push({ path: `/tabs/find-groups` });
}

async function doReorder(event: CustomEvent) {
  const previousSeq = JSON.parse(JSON.stringify(selectedFacilities.value));

  // returns the updated sequence after reordering
  const updatedSeq = event.detail.complete(JSON.parse(JSON.stringify(selectedFacilities.value)));

  let diffSeq = findMemberFacilitySequenceDiff(previousSeq, updatedSeq);

  const updatedSeqenceNum = previousSeq.map((memberFacility: any) => memberFacility.sequenceNum);
  Object.keys(diffSeq).map((key: any) => {
    diffSeq[key].sequenceNum = updatedSeqenceNum[key];
  });

  diffSeq = Object.keys(diffSeq).map((key) => diffSeq[key]);
  selectedFacilities.value = updatedSeq;

  if (diffSeq.length) {
    isFacilityMembersModified.value = true;
    commonUtil.showToast(translate("Facilities order has been changed. Click save button to update them."));
  }
}

function findMemberFacilitySequenceDiff(previousSeq: any, updatedSeq: any) {
  const diffSeq: any = Object.keys(previousSeq).reduce((diff, key) => {
    if (updatedSeq[key].facilityId === previousSeq[key].facilityId && updatedSeq[key].sequenceNum === previousSeq[key].sequenceNum) return diff;
    return {
      ...diff,
      [key]: updatedSeq[key]
    };
  }, {});
  return diffSeq;
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
.search {
  border-right: 1px solid lightgray;
}
</style>