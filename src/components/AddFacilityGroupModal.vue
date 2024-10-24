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
  </ion-header>

  <ion-content>
    <ion-searchbar v-model="queryString" @keyup.enter="queryString = $event.target.value; findGroups()"/>

    <form @keyup.enter="updateGroups">
      <ion-list>
        <ion-item-group v-for="(groups, typeId) in filteredFacilityGroupsByType" :key="typeId">
          <ion-item-divider color="medium">{{ typeId === "null" ? translate('Others') : getFacilityGroupTypeDesc(typeId) }}</ion-item-divider>
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

<script lang="ts">
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
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from 'vuex'
import { hasError } from "@hotwax/oms-api";
import { FacilityService } from "@/services/FacilityService";
import logger from "@/logger";
import emitter from "@/event-bus";
import { showToast } from "@/utils";
import { DateTime } from "luxon";

export default defineComponent({
  name: "AddFacilityGroupModal",
  components: {
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
    IonToolbar
  },
  data() {
    return {
      facilityGroupsByType: {},
      filteredFacilityGroupsByType: {} as any,
      groupsToAdd: [] as Array<string>,
      groupsToRemove: [] as Array<string>,
      queryString: ''
    }
  },
  computed: {
    ...mapGetters({
      current: 'facility/getCurrent',
      facilityGroupTypes: 'util/getFacilityGroupTypes'
    })
  },
  async mounted() {
    await this.fetchFacilityGroups();
  },
  methods: {
    closeModal(fetchGroups = false) {
      modalController.dismiss({ fetchGroups });
    },
    async updateGroupsForFacility(facilityGroupId: string) {
      // if clicked on an already added group
      if(this.isFacilityGroupLinked(facilityGroupId)) {
        if(this.groupsToRemove.includes(facilityGroupId)) {
          this.groupsToRemove.splice(this.groupsToRemove.indexOf(facilityGroupId), 1)
        } else {
          this.groupsToRemove.push(facilityGroupId)
        }
        return;
      }

      if(this.groupsToAdd.includes(facilityGroupId)) {
        this.groupsToAdd.splice(this.groupsToAdd.indexOf(facilityGroupId), 1)
      } else {
        this.groupsToAdd.push(facilityGroupId)
      }
    },
    async updateGroups() {
      if(!this.groupsToAdd.length && !this.groupsToRemove.length) {
        showToast(translate('Please select/de-select groups to link/unlink from facility'))
        return;
      }

      emitter.emit("presentLoader");

      // Defined this to check if any of the api gets failed when linking multiple groups to the facility
      let isFacilityGroupRespHasError = false;

      // Using for..of loop as when calling the apis in parallel (using Promise.all) some of the groups doesn't gets linked to the facility
      // even on api success, thus calling the apis one by one inside for..of.
      for(let groupId of this.groupsToAdd) {
        try {
          await this.addFacilityToGroup(groupId);
        } catch {
          isFacilityGroupRespHasError = true;
        }
      }

      for(let groupId of this.groupsToRemove) {
        try {
          await this.removeFacilityFromGroup(groupId);
        } catch {
          isFacilityGroupRespHasError = true;
        }
      }

      if(isFacilityGroupRespHasError) {
        showToast(translate('Failed to update some groups for facility'))
      } else {
        showToast(translate('Updated groups for facility'))
      }
      emitter.emit("dismissLoader");
      this.closeModal(true);
    },
    async addFacilityToGroup(facilityGroupId: string) {
      let resp;
      try {
        resp = await FacilityService.addFacilityToGroup({
          "facilityId": this.current.facilityId,
          "facilityGroupId": facilityGroupId
        })

        if(hasError(resp)) {
          throw resp.data
        }
        return Promise.resolve(resp.data)
      } catch (err) {
        logger.error('Failed to add group to facility', err)
        return Promise.reject(err)
      }
    },
    async removeFacilityFromGroup(facilityGroupId: string) {
      let resp;

      const groupInformation = this.current.groupInformation.find((group: any) => group.facilityGroupId === facilityGroupId)

      try {

        resp = await FacilityService.updateFacilityToGroup({
          "facilityId": this.current.facilityId,
          "facilityGroupId": facilityGroupId,
          "fromDate": groupInformation.fromDate,
          "thruDate": DateTime.now().toMillis()
        })

        if (hasError(resp)) {
          throw resp.data;
        }
        return Promise.resolve(resp.data)
      } catch (err) {
        logger.error('Failed to remove group from facility', err)
        return Promise.reject(err)
      }
    },
    async fetchFacilityGroups() {
      const params = {
        entityName: "FacilityGroup",
        noConditionFind: 'Y',
        orderBy: "facilityGroupTypeId ASC",
        fieldList: ["facilityGroupId", "facilityGroupTypeId", "facilityGroupName", "description"],
        viewSize: 50
      }

      try {
        const resp = await FacilityService.fetchFacilityGroups(params);

        if(!hasError(resp) && resp.data?.docs?.length > 0) {
          this.filteredFacilityGroupsByType = this.facilityGroupsByType = resp.data.docs.reduce((groupsByType: any, group: any) => {
            if(groupsByType[group.facilityGroupTypeId]) {
              groupsByType[group.facilityGroupTypeId].push(group)
            } else {
              groupsByType[group.facilityGroupTypeId] = [group]
            }

            return groupsByType
          }, {})
        } else {
          throw resp.data
        }
      } catch(err) {
        logger.error('Failed to find facility groups', err)
      }
    },
    isFacilityGroupLinked(facilityGroupId: string) {
      return this.current.groupInformation?.some((group: any) => group.facilityGroupId === facilityGroupId)
    },
    findGroups() {
      // when searched empty return the same list again
      if(!this.queryString.trim()) {
        this.filteredFacilityGroupsByType = this.facilityGroupsByType
        return;
      }

      // converting to lowercase to search without honoring case
      const keyword = this.queryString.trim().toLowerCase();

      this.filteredFacilityGroupsByType = Object.values(this.facilityGroupsByType).reduce((filteredGroups: any, groups: any) => {
        groups.map((group: any) => {
          if(group.facilityGroupId.toLowerCase().includes(keyword) || group.facilityGroupName.toLowerCase().includes(keyword)) {
            if(filteredGroups[group.facilityGroupTypeId]) {
              filteredGroups[group.facilityGroupTypeId].push(group)
            } else {
              filteredGroups[group.facilityGroupTypeId] = [group]
            }
          }
        })
        return filteredGroups
      }, {})
    },
    getFacilityGroupTypeDesc(groupTypeId: any) {
      return this.facilityGroupTypes.find((groupType: any) => groupType.facilityGroupTypeId === groupTypeId)?.description || groupTypeId
    }
  },
  setup() {
    const store = useStore();

    return {
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