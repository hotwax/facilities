<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Staff") }}</ion-title>
    </ion-toolbar>
    <ion-toolbar>
      <ion-searchbar v-model="queryString" @keyup.enter="queryString = $event.target.value; findParties()"/>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <div class="ion-padding" v-if="!parties.length">
      {{ translate("No party found") }}
    </div>
    <ion-list v-else>
      <ion-list-header>{{ translate("Staff") }}</ion-list-header>
      <ion-item v-for="(party, index) in parties" :key="index">
        <ion-select interface="popover" :placeholder="translate('Select')" :value="getPartyRoleTypeId(party.partyId)" @ion-change="updateSelectedParties($event, party.partyId)" required>
          <ion-label slot="label">
            {{ party.fullName }}
            <p>{{ party.partyId }}</p>
          </ion-label>
          <ion-select-option v-for="(description, roleTypeId) in partyRoles" :key='roleTypeId' :value="roleTypeId">{{ description }}</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button :disabled="!isRoleUpdated()" @click="saveParties">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script setup lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeCircle, closeOutline, saveOutline } from "ionicons/icons";
import { translate } from "@common"
import { commonUtil } from "@common";
import logger from "@/logger";
import { DateTime } from "luxon";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { ref, computed, onMounted } from "vue";

const props = defineProps(['facilityId', 'selectedParties']);
const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const partyRoles = computed(() => utilStore.getPartyRoles);

const parties = ref([] as any);
const queryString = ref('');
const selectedPartyValues = ref(JSON.parse(JSON.stringify(props.selectedParties)));

onMounted(async () => {
  await findParties();
});

function closeModal() {
  modalController.dismiss();
}

async function findParties() {
  emitter.emit('presentLoader');

  parties.value = [];

  try {
    const resp = await facilityStore.getPartyRoleAndPartyDetails({
      roleTypeId: 'APPLICATION_USER',
      keyword: queryString.value || undefined
    });
    if (!commonUtil.hasError(resp)) {
      const docs = resp.data.partyRoleAndPartyDetails;

      docs.map((party: any) => {
        party.fullName = party.groupName ? party.groupName : party.firstName ? `${party.firstName} ${party.lastName}` : '';
      });
      parties.value = docs;
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error(err);
  }

  emitter.emit('dismissLoader');
}

async function saveParties() {
  emitter.emit('presentLoader');

  const partiesToAdd = selectedPartyValues.value.filter((selectedParty: any) => !props.selectedParties.some((party: any) => party.partyId === selectedParty.partyId && party.roleTypeId === selectedParty.roleTypeId));
  const partiesToRemove = props.selectedParties.filter((party: any) => !selectedPartyValues.value.some((selectedParty: any) => party.partyId === selectedParty.partyId));
  const partiesRoleChanged = props.selectedParties.filter((party: any) => selectedPartyValues.value.some((selectedParty: any) => selectedParty.partyId === party.partyId && selectedParty.roleTypeId !== party.roleTypeId));
  partiesRoleChanged.map((party: any) => partiesToRemove.push(party));

  if (!(partiesToAdd.length > 0 || partiesToRemove.length > 0)) {
    commonUtil.showToast(translate("Please update atleast one party role."));
    emitter.emit('dismissLoader');
    return;
  }

  const removePromises = partiesToRemove.map((party: any) =>
    facilityStore.removePartyFromFacility({
      facilityId: props.facilityId,
      fromDate: party.fromDate,
      thruDate: DateTime.now().toMillis(),
      partyId: party.partyId,
      roleTypeId: party.roleTypeId
    })
  );

  const addPromises = partiesToAdd.map((party: any) =>
    facilityStore.addPartyToFacility({
      facilityId: props.facilityId,
      partyId: party.partyId,
      roleTypeId: party.roleTypeId
    })
  );

  const responses = await Promise.allSettled([...removePromises, ...addPromises]);
  const hasFailed = responses.some((response: any) => response.status === 'rejected');
  
  if (hasFailed) {
    commonUtil.showToast(translate("Failed to update some role(s)."));
  } else {
    commonUtil.showToast(translate("Role(s) updated successfully."));
  }

  // refetching parties with updated roles
  await facilityStore.getFacilityParties({ facilityId: props.facilityId });
  modalController.dismiss();
  emitter.emit('dismissLoader');
}

function updateSelectedParties(event: CustomEvent, selectedPartyId: string) {
  let party = {} as any;
  const selectedRoleTypeId = event.detail.value;

  party = getParty(selectedPartyId);
  if (party?.partyId) {
    party = selectedPartyValues.value.find((p: any) => p.partyId === selectedPartyId);
    selectedPartyValues.value = selectedPartyValues.value.filter((p: any) => p.partyId !== selectedPartyId);

    if (selectedRoleTypeId) {
      selectedPartyValues.value.push({ ...party, roleTypeId: selectedRoleTypeId });
    }
  } else {
    party = parties.value.find((p: any) => p.partyId === selectedPartyId);
    selectedPartyValues.value.push({ ...party, roleTypeId: selectedRoleTypeId });
  }
}

function getParty(partyId: string) {
  return selectedPartyValues.value.find((party: any) => party.partyId === partyId);
}

function getPartyRoleTypeId(partyId: string) {
  const party = getParty(partyId);
  return party ? party.roleTypeId : '';
}

function isRoleUpdated() {
  const arePartiesUpdated = selectedPartyValues.value.length !== props.selectedParties.length;
  return arePartiesUpdated || selectedPartyValues.value.some((selectedParty: any) => {
    const originalParty = props.selectedParties.find((party: any) => party.partyId === selectedParty.partyId);
    return originalParty && selectedParty.roleTypeId !== originalParty.roleTypeId;
  });
}
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>