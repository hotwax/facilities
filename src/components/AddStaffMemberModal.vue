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
    <ion-row>
      <ion-chip v-for="party in selectedPartyValues" :key="party.partyId">
        <ion-label>{{ party.groupName ? party.groupName : `${party.firstName} ${party.lastName}` }}</ion-label>
        <ion-icon :icon="closeCircle" @click="removeSelectedParty(party.partyId)" />
      </ion-chip>
    </ion-row>

    <ion-list>
      <ion-list-header>{{ translate("Staff") }}</ion-list-header>
      <!-- TODO: added click event on the item as when using the ionChange event then it's getting
      called every time the v-for loop runs and then removes or adds the currently rendered picker
      -->
      <div class="ion-padding" v-if="!parties.length">{{ translate("No party found") }}</div>
      <div v-else>
        <ion-item v-for="(party, index) in parties" :key="index">
          <ion-label>
            {{ party.groupName ? party.groupName : `${party.firstName} ${party.lastName}` }}
            <p>{{ party.partyId }}</p>
          </ion-label>
          <ion-select interface="popover" :placeholder="translate('Select')" :value="getPartyRoleId(party.partyId)" @ion-change="updateSelectedParties($event, party.partyId)" required>
            <ion-select-option v-for="role in roles" :key='role.roleTypeId' :value="role.roleTypeId">{{ role.description }}</ion-select-option>
        </ion-select>
        </ion-item>
      </div>
    </ion-list>
  </ion-content>

  <ion-fab @click="saveParties" vertical="bottom"  horizontal="end" slot="fixed">
    <ion-fab-button>
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
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
  IonRow,
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

export default defineComponent({
  name: "AddStaffMemberModal",
  components: {
    IonButton,
    IonButtons,
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
    IonRow,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  props: ['selectedParties'],
  data () {
    return {
      selectedPartyValues: JSON.parse(JSON.stringify(this.selectedParties)),
      queryString: '',
      parties: []
    }
  },
  computed: {
    ...mapGetters({
      roles: 'util/getRoles',
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
        inputFields,
        viewSize: 10,
        entityName: 'PartyRoleAndPartyDetail',
        noConditionFind: 'Y',
        distinct: 'Y',
        orderBy: "firstName ASC",
        fieldList: ['firstName', 'groupName', 'lastName', 'partyId']
      }

      try {
        const resp = await FacilityService.getPartyRoleAndPartyDetails(payload)
        if(!hasError(resp)) {
          this.parties = resp.data.docs
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error(err)
      }
    },
    removeSelectedParty(id: string) {
      this.selectedPartyValues = this.selectedPartyValues.filter((party: any) => party.partyId !== id)
    },
    saveParties() {
      const partiesToCreate = this.selectedPartyValues.filter((selectedParty: any) => !this.selectedParties.some((party: any) => party.partyId === selectedParty.partyId && party.roleTypeId === selectedParty.roleTypeId))
      const partiesToRemove = this.selectedParties.filter((party: any) => !this.selectedPartyValues.some((selectedParty: any) => party.partyId === selectedParty.partyId))
      const partiesRoleChanged = this.selectedParties.filter((party: any) => this.selectedPartyValues.some((selectedParty: any) => selectedParty.partyId === party.partyId && selectedParty.roleTypeId !== party.roleTypeId))
      partiesRoleChanged.map((party: any) => partiesToRemove.push(party))

      if(!(partiesToCreate.length > 0 || partiesToRemove.length > 0)) {
        showToast(translate("Please update atleast one party role."))
        return;
      }

      modalController.dismiss({
        dismissed: true,
        value: {
          partiesToCreate,
          partiesToRemove
        }
      });
    },
    updateSelectedParties(event: CustomEvent, id: string) {
      let party = {} as any
      if(this.isPartySelected(id)){
        party = this.selectedPartyValues.find((party: any) => party.partyId === id)
        if(event.detail.value === 'none') {
          this.selectedPartyValues = this.selectedPartyValues.filter((party: any) => party.partyId !== id)
        } else if(event.detail.value !== party.roleTypeId) {
          this.selectedPartyValues = this.selectedPartyValues.filter((party: any) => party.partyId !== id)
          this.selectedPartyValues.push({...party, roleTypeId: event.detail.value})
        }
      } else {
        party = this.parties.find((party: any) => party.partyId === id)
        this.selectedPartyValues.push({...party, roleTypeId: event.detail.value})
      }
    },
    isPartySelected(partyId: any) {
      return this.selectedPartyValues.find((party: any) => party.partyId === partyId)
    },
    getPartyRoleId(partyId: any) {
      return this.selectedPartyValues.find((party: any) => party.partyId === partyId) ? this.selectedPartyValues.find((party: any) => party.partyId === partyId).roleTypeId : 'none'
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