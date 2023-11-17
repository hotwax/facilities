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
      <ion-chip v-for="party in selectedParties" :key="party.partyId">
        <ion-label>{{ party.groupName ? party.groupName : `${party.firstName} : ${party.lastName}` }}</ion-label>
        <ion-icon :icon="closeCircle" />
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
          <ion-select interface="popover" :placeholder="translate('Select')" value="" @ion-change="updateSelectedParties($event, party.partyId)" required>
            <ion-select-option value="">{{ "None" }}</ion-select-option>
            <ion-select-option value="fulfillment">{{ "Fulfillment" }}</ion-select-option>
            <ion-select-option>{{ "WAREHOUSE_MANAGER" }}</ion-select-option>
        </ion-select>
        </ion-item>
      </div>
    </ion-list>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
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
  data () {
    return {
      selectedParties: [] as any,
      queryString: '',
      parties: []
    }
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
    updateSelectedParties(event: CustomEvent, id: string) {
      if(event.detail.value !== ''){
        if (!this.isPartySelected(id)) this.selectedParties.push(this.parties.find((party: any) => party.partyId === id))
      } else {
        if(this.isPartySelected(id)) {
          // if party is already selected then removing that party from the list on click
          this.selectedParties = this.selectedParties.filter((party: any) => party.partyId !== id)
        }
      }
    },
    isPartySelected(partyId: any) {
      return this.selectedParties.find((party: any) => party.partyId === partyId)
    }
  },
  async mounted() {
    // getting picker information on initial load
    await this.findParties()
  },
  setup() {
    return {
      closeCircle,
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>