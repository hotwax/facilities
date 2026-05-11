<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Groups") }}</ion-title>
        <ion-segment v-model="segment" slot="end" @ion-change="resetParentGroupPage()">
          <ion-segment-button value="facility-groups" >
            <ion-label>{{ translate("Facility groups") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="facility-group-types">
            <ion-label>{{ translate("Parent group associations") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <template v-if="segment === 'facility-groups'">
        <div class="find">
          <section class="search">
            <ion-searchbar :placeholder="translate('Search groups')" v-model="query.queryString" @keyup.enter="updateQuery()" />
          </section>
        </div>
        <main v-if="groups && groups.length > 0">
          <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
            <ion-item lines="full">
              <ion-label class="ion-text-wrap">
                <p>{{ group.facilityGroupId }}</p>
                <h1>{{ group.facilityGroupName }}</h1>
                <p>{{ group.description }}</p>
              </ion-label>
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate('Group type') }}</ion-label>
              <ion-chip outline slot="end" @click="updateGroupTypeModal(group)">
                {{ group.facilityGroupTypeId ? getFacilityGroupTypeDescription(group.facilityGroupTypeId) ? getFacilityGroupTypeDescription(group.facilityGroupTypeId) : group.facilityGroupTypeId : "-" }}
              </ion-chip>
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate('Product stores') }}</ion-label>
              <ion-chip outline slot="end" @click="openAddProductStoreToGroupModal(group)">
                {{ group.productStoreCount || 0 }}
              </ion-chip>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Facilities') }}</ion-label>
              <ion-chip outline slot="end" @click="manageFacilities(group)">
                {{ group.facilityCount}}
              </ion-chip>
            </ion-item>
            <ion-button fill="clear" @click="updateGroupDescriptionModal(group)">
              {{translate('Edit details')}}
            </ion-button>
          </ion-card>
        </main>
        <main v-else>
          <p class="empty-state">{{ translate("No groups found") }}</p>
        </main>
      </template>
      <template v-else>
        <div class="facility-group-types">
          <section>
            <ion-card>
              <ion-card-header>
                <ion-card-title>{{ translate("Parent groups") }}</ion-card-title>
              </ion-card-header>
              <ion-item v-for="groupType in facilityGroupTypes" :key="groupType.facilityGroupId" @click="setCurrentFacilityGroupType(groupType.facilityGroupTypeId)" detail button>
                <ion-label :color="groupType.facilityGroupTypeId === currentFacilityGroupTypeId ? 'primary' : ''">
                  {{ groupType.description ? groupType.description : groupType.facilityGroupTypeId }}
                </ion-label>
                <ion-note slot="end">{{ getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId).length }}</ion-note>
              </ion-item>
            </ion-card>
          </section>
          <div class="facility-group-type-details" v-show="currentFacilityGroupTypeId">
            <h3>{{ getFacilityGroupTypeDescription(currentFacilityGroupTypeId) }}</h3>
            <ion-list v-if="groups.length">
              <ion-list-header>
                <ion-label>{{ translate('Selected groups') }} : {{ getAssociatedFacilityGroupIds(currentFacilityGroupTypeId).length }}</ion-label>
              </ion-list-header>
              <ion-item v-for="group in groups" :key="group.facilityGroupId" @click.stop="updateFacilityGroup(group)">
                <ion-checkbox label-placement="end" justify="start" :disabled="!!group.facilityGroupTypeId && group.facilityGroupTypeId !== currentFacilityGroupTypeId" :modelValue="isFacilityGroupLinked(group.facilityGroupTypeId)">
                  <ion-label>
                    {{ group.facilityGroupName }}
                    <p>{{ group.facilityGroupId }}</p>
                  </ion-label>
                </ion-checkbox>
                <ion-note slot="end">{{ group.facilityCount }}</ion-note>
              </ion-item>
            </ion-list> 
            <div v-else>
              <p class="empty-state">{{ translate("No groups found") }}</p>
            </div>
          </div>
        </div>
      </template>

      <ion-fab v-if="segment === 'facility-groups'" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createFacilityGroup()">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  modalController,
  createAnimation,
  onIonViewWillEnter
} from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { addOutline, bagHandleOutline, businessOutline, ellipsisVerticalOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { translate } from '@hotwax/dxp-components'
import { customSort, showToast } from '@/utils';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import logger from '@/logger';
import AddProductStoreToGroupModal from '@/components/AddProductStoreToGroupModal.vue';
import GroupTypeModal from "@/components/GroupTypeModal.vue";
import FacilityGroupDescriptionModal from "@/components/FacilityGroupDescriptionModal.vue";
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';

const router = useRouter();
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const segment = ref("facility-groups");
const currentFacilityGroupTypeId = ref("");
const isParentGroupDetailAnimationCompleted = ref(false);

const groups = computed(() => facilityStore.getFacilityGroups);
const facilityGroupTypes = computed(() => utilStore.getFacilityGroupTypes);
const isScrollable = computed(() => facilityStore.isFacilityGroupsScrollable);
const query = computed(() => facilityStore.getGroupQuery);

onMounted(async () => {
  await utilStore.fetchFacilityGroupTypes();
});

onIonViewWillEnter(async () => {
  segment.value = "facility-groups";
  await fetchGroups();
  await resetParentGroupPage();
});

async function resetParentGroupPage() {
  if (segment.value === 'facility-groups') {
    currentFacilityGroupTypeId.value = '';
    isParentGroupDetailAnimationCompleted.value = false;
  } else {
    query.value.queryString = "";
    await updateQuery();
  }
}

function setCurrentFacilityGroupType(facilityGroupTypeId: string) {
  currentFacilityGroupTypeId.value = facilityGroupTypeId;
  if (currentFacilityGroupTypeId.value && !isParentGroupDetailAnimationCompleted.value) {
    playAnimation();
    isParentGroupDetailAnimationCompleted.value = true;
  }
}

function isFacilityGroupLinked(facilityGroupTypeId: any) {
  return currentFacilityGroupTypeId.value === facilityGroupTypeId;
}

async function updateFacilityGroup(facilityGroup: any) {
  const isChecked = !isFacilityGroupLinked(facilityGroup.facilityGroupTypeId);
  try {
    const resp = await FacilityService.updateFacilityGroup({
      "facilityGroupId": facilityGroup.facilityGroupId,
      "facilityGroupTypeId": isChecked ? currentFacilityGroupTypeId.value : ''
    });

    if (!hasError(resp)) {
      const message = isChecked ? "Group associated to parent group." : "Group removed from parent group.";
      showToast(translate(message));
      const updatedGroups = groups.value.map((group: any) => {
        if (group.facilityGroupId === facilityGroup.facilityGroupId) {
          return { ...group, facilityGroupTypeId: isChecked ? currentFacilityGroupTypeId.value : '' };
        }
        return group;
      });
      await facilityStore.updateFacilityGroups(updatedGroups);
    } else {
      throw resp.data;
    }
  } catch (err) {
    const message = isChecked ? "Failed to associate group to parent group." : "Failed to remove group from parent group.";
    logger.error(message, err);
    showToast(translate(message));
  }
}

function getFacilityGroupTypeDescription(facilityGroupTypeId: string) {
  const facilityGroupType = facilityGroupTypes.value.find(((groupType: any) => groupType.facilityGroupTypeId === facilityGroupTypeId));
  return facilityGroupType?.description ? facilityGroupType?.description : facilityGroupTypeId;
}

async function updateQuery() {
  await facilityStore.updateGroupQuery(query.value);
  await fetchGroups();
}

async function fetchGroups() {
  const viewSize = import.meta.env.VITE_APP_VIEW_SIZE;
  let viewIndex = 0;
  do {
    const payload = {
      viewSize,
      viewIndex
    };
    await facilityStore.fetchFacilityGroups(payload);
    viewIndex++;
  }
  while (isScrollable.value);
}

function getAssociatedFacilityGroupIds(facilityGroupTypeId: any) {
  const associatedfacilityGroupIds = [] as any;
  groups.value.forEach((group: any) => {
    if (group.facilityGroupTypeId && group.facilityGroupTypeId === facilityGroupTypeId) {
      associatedfacilityGroupIds.push(group.facilityGroupId);
    }
  });
  return associatedfacilityGroupIds;
}

function createFacilityGroup() {
  router.push('/create-facility-group');
}

async function updateGroupTypeModal(group: any) {
  const modal = await modalController.create({
    component: GroupTypeModal,
    componentProps: { facilityGroup: group }
  });
  modal.present();
}

async function updateGroupDescriptionModal(group: any) {
  const modal = await modalController.create({
    component: FacilityGroupDescriptionModal,
    componentProps: { facilityGroup: group }
  });
  modal.present();
}

function manageFacilities(facilityGroup: any) {
  router.push({ path: `/manage-facilities/${facilityGroup.facilityGroupId}` });
}

async function openAddProductStoreToGroupModal(group: any) {
  const modal = await modalController.create({
    component: AddProductStoreToGroupModal,
    componentProps: { group }
  });
  modal.present();
}

function playAnimation() {
  const typeDetails = document.querySelector('.facility-group-type-details') as Element;
  const groupTypes = document.querySelector('.facility-group-types') as Element;

  if (!typeDetails || !groupTypes) return;

  const revealAnimation = createAnimation()
    .addElement(typeDetails)
    .duration(1500)
    .easing('ease')
    .keyframes([
      { offset: 0, flex: '0', opacity: '0' },
      { offset: 0.5, flex: '1', opacity: '0' },
      { offset: 1, flex: '1', opacity: '1' }
    ]);

  const gapAnimation = createAnimation()
    .addElement(groupTypes)
    .duration(500)
    .fromTo('gap', '0', 'var(--spacer-2xl)');

  createAnimation()
    .addAnimation([gapAnimation, revealAnimation])
    .play();
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}

main:has(ion-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start;
}

.facility-group-types {
  display: flex;
  justify-content: center;
  align-items: start;
  gap: var(--spacer-2xl);
  max-width: 990px;
  margin: var(--spacer-base) auto 0;
}

.facility-group-types > section {
  display: grid;
  grid-template-columns: minmax(400px, 1fr);
  max-width: 50ch;
}
.facility-group-type-details {
  flex: 1 0 355px;
  position: sticky;
  top: var(--spacer-lg);
  flex: 1;
}
@media (min-width: 991px) {
  .facility-group-type-details {
    width: 0px;
    opacity: 0;
  }
}
</style>