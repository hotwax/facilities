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
  </ion-header>

  <ion-content class="ion-padding">
    <ion-searchbar v-model="queryString" @keyup.enter="queryString = $event.target.value; findParties()"/>

    <div class="ion-padding" v-if="!parties.length">
      {{ translate("No party found") }}
    </div>
    <ion-list v-else>
      <ion-list-header>{{ translate("Staff") }}</ion-list-header>
      <ion-item v-for="(party, index) in parties" :key="index">
        <ion-label>
          {{ party.fullName }}
          <p>{{ party.partyId }}</p>
        </ion-label>
        <ion-select interface="popover" :placeholder="translate('Select')" :value="getPartyRoleTypeId(party.partyId)" @ion-change="updateSelectedParties($event, party.partyId)" required>
          <ion-select-option v-for="(description, roleTypeId) in partyRoles" :key='roleTypeId' :value="roleTypeId">{{ description }}</ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button @click="saveParties">
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
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
import { defineComponent } from "vue";
import { closeCircle, closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { FacilityService } from "@/services/FacilityService";
import { hasError } from "@/adapter";
import logger from "@/logger";
import { mapGetters, useStore } from "vuex";
import { showToast } from "@/utils";
import { DateTime } from "luxon";

export default defineComponent({
  name: "AddStaffMemberModal",
  components: {
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
    IonToolbar
  },
  props: ['facilityId', 'selectedParties'],
  data() {
    return {
      parties: [] as any,
      queryString: '',
      selectedPartyValues: JSON.parse(JSON.stringify(this.selectedParties))
    }
  },
  computed: {
    ...mapGetters({
      partyRoles: 'util/getPartyRoles',
    })
  },
  methods: {
    async closeModal() {
      modalController.dismiss()
    },
    async findParties() {
      this.parties = []
      let inputFields = {}
      if(this.queryString.length > 0) {
        inputFields = {
          groupName_value: this.queryString,
          groupName_op: 'contains',
          groupName_ic: 'Y',
          groupName_grp: '1',
          firstName_value: this.queryString,
          firstName_op: 'contains',
          firstName_ic: 'Y',
          firstName_grp: '2',
          lastName_value: this.queryString,
          lastName_op: 'contains',
          lastName_ic: 'Y',
          lastName_grp: '3'
        }
      }

      const payload = {
        inputFields: {
          ...inputFields,
          roleTypeId: 'APPLICATION_USER'
        },
        viewSize: 10,
        entityName: 'PartyRoleAndPartyDetail',
        noConditionFind: 'Y',
        distinct: 'Y',
        orderBy: "firstName ASC",
        fieldList: ['partyId', 'firstName', 'groupName', 'lastName']
      }

      try {
        const resp = await FacilityService.getPartyRoleAndPartyDetails(payload)
        if(!hasError(resp)) {
          let parties = resp.data.docs

          parties.map((party: any) => {
            party.fullName = party.groupName ? party.groupName : `${party.firstName} ${party.lastName}`
          })
          this.parties = parties
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    async saveParties() {
      const partiesToAdd = this.selectedPartyValues.filter((selectedParty: any) => !this.selectedParties.some((party: any) => party.partyId === selectedParty.partyId && party.roleTypeId === selectedParty.roleTypeId))
      const partiesToRemove = this.selectedParties.filter((party: any) => !this.selectedPartyValues.some((selectedParty: any) => party.partyId === selectedParty.partyId))
      const partiesRoleChanged = this.selectedParties.filter((party: any) => this.selectedPartyValues.some((selectedParty: any) => selectedParty.partyId === party.partyId && selectedParty.roleTypeId !== party.roleTypeId))
      partiesRoleChanged.map((party: any) => partiesToRemove.push(party))

      if(!(partiesToAdd.length > 0 || partiesToRemove.length > 0)) {
        showToast(translate("Please update atleast one party role."))
        return;
      }

      const removeResponses = await Promise.allSettled(partiesToRemove
        .map(async (party: any) => await FacilityService.removePartyFromFacility({
          facilityId: this.facilityId,
          fromDate: party.fromDate,
          thruDate: DateTime.now().toMillis(),
          partyId: party.partyId,
          roleTypeId: party.roleTypeId
        }))
      )

      const addResponses = await Promise.allSettled(partiesToAdd
        .map(async (party: any) => await FacilityService.addPartyToFacility({
          facilityId: this.facilityId,
          partyId: party.partyId,
          roleTypeId: party.roleTypeId
        }))
      )

      const hasFailedResponse = [...removeResponses, ...addResponses].some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        showToast(translate("Failed to update some role(s)."))
      } else {
        showToast(translate("Role(s) updated successfully."))
      }

      // refetching parties with updated roles
      await this.store.dispatch('facility/getFacilityParties', { facilityId: this.facilityId })
      modalController.dismiss()
    },
    updateSelectedParties(event: CustomEvent, selectedPartyId: string) {
      let party = {} as any
      const selectedRoleTypeId = event.detail.value

      party = this.getParty(selectedPartyId)
      if(party?.partyId) {
        party = this.selectedPartyValues.find((party: any) => party.partyId === selectedPartyId)
        this.selectedPartyValues = this.selectedPartyValues.filter((party: any) => party.partyId !== selectedPartyId)

        if(selectedRoleTypeId) {
          this.selectedPartyValues.push({...party, roleTypeId: selectedRoleTypeId})
        }
      } else {
        party = this.parties.find((party: any) => party.partyId === selectedPartyId)
        this.selectedPartyValues.push({...party, roleTypeId: selectedRoleTypeId})
      }
    },
    getParty(partyId: string) {
      return this.selectedPartyValues.find((party: any) => party.partyId === partyId)
    },
    getPartyRoleTypeId(partyId: string) {
      return this.getParty(partyId) ? this.getParty(partyId).roleTypeId : ''
    }
  },
  async mounted() {
    await this.findParties()
  },
  setup() {
    const store = useStore()

    return {
      closeCircle,
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>