<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/" />
        <ion-title>{{ translate("Groups") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content id="filter-content">
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search groups')" v-model="query.queryString" @keyup.enter="updateQuery()" />
          <ion-list>
            <ion-list-header>
              {{ translate('System groups') }}
            </ion-list-header>
            <ion-item v-for="groupType in facilityGroupTypes" :key="groupType.facilityGroupId">
              <ion-label>
                {{ groupType.description }}
              </ion-label>
              <ion-select v-if="getAvailableFacilityGroups(groupType.facilityGroups).length" :placeholder="translate('Select')" :selectedText="groupType.facilityGroups.length > 1 ? groupType.facilityGroups.length : groupType.facilityGroups[0]" :value="groupType.facilityGroups" @ionChange="updateFacilityGroupAssociation($event, groupType.facilityGroups, groupType.facilityGroupTypeId)" :multiple="true">
                <ion-select-option :value="groupId" :key="groupId" v-for="groupId in getAvailableFacilityGroups(groupType.facilityGroups)">
                  {{ getFacilityGroupName(groupId) }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </section>

        <main v-if="groups.length">
          <div class="groups">
            <!-- custom sorting in the UI to keep OMS_FULFILLMENT and PICKUP types first -->
            <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
              <ion-item lines="full">
                <ion-label>
                  {{ group.facilityGroupName }}
                  <p>{{ group.facilityGroupId }}</p>
                </ion-label>
                <ion-badge slot="end">{{ group.facilityGroupTypeId }}</ion-badge>
                <ion-button slot="end" @click="openFacilityGroupActionsPopover($event, group)" fill="clear" color="medium">
                  <ion-icon :icon="ellipsisVerticalOutline" slot="icon-only"/>
                </ion-button>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Facilities') }}</ion-label>
                <ion-note slot="end">{{ group.facilityCount }}</ion-note>
              </ion-item>
              <ion-item lines="full" v-if="group.description">
                <ion-label>{{ group.description }}</ion-label>
              </ion-item>
            </ion-card> 
            <ion-card>
              <ion-button color="medium" fill="clear" @click="openCreateFacilityGroupModal()">
                <ion-icon :icon="addOutline" slot="start"/>
                {{ translate('Create group') }}
              </ion-button>
            </ion-card>
          </div>   
        </main>
        <main v-else>
          <p class="empty-state">{{ translate("No groups found") }}</p>
        </main>
      </div>

      <ion-infinite-scroll
        @ionInfinite="loadMoreGroups($event)"
        threshold="100px"
        :disabled="!isScrollable"
      >
        <ion-infinite-scroll-content
          loading-spinner="crescent"
          :loading-text="translate('Loading')"
        />
      </ion-infinite-scroll>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonButton,
  IonBackButton,
  IonBadge,
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  modalController,
  popoverController,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { ellipsisVerticalOutline, addOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'
import { customSort, showToast } from '@/utils';
import CreateFacilityGroupModal from '@/components/CreateFacilityGroupModal.vue';
import FacilityGroupActionsPopover from '@/components/FacilityGroupActionsPopover.vue';
import { FacilityService } from '@/services/FacilityService';
import { hasError } from '@/adapter';
import logger from '@/logger';
import emitter from '@/event-bus';

export default defineComponent({
  name: 'FindGroups',
  components: {
    IonButton,
    IonBackButton,
    IonBadge,
    IonCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      groups: "facility/getFacilityGroups",
      facilityGroupTypes: "util/getFacilityGroupTypes",
      isScrollable: "facility/isFacilityGroupsScrollable",
      query: "facility/getGroupQuery",
    })
  },
  async mounted() {
    await this.fetchGroups();
    await this.store.dispatch('util/fetchFacilityGroupTypes')
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('facility/updateGroupQuery', this.query)
      this.fetchGroups();
    },
    async fetchGroups(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchFacilityGroups', payload)
    },
    async loadMoreGroups(event: any) {
      this.fetchGroups(
        undefined,
        Math.ceil(
          this.groups?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(() => {
        event.target.complete();
      });
    },
    async openCreateFacilityGroupModal() {
      const createVirtualFacility = await modalController.create({
        component: CreateFacilityGroupModal
      })

      createVirtualFacility.present()
    },
    async openFacilityGroupActionsPopover(event: Event, group: any) {
      const facilityGroupActionsPopover = await popoverController.create({
        component: FacilityGroupActionsPopover,
        event,
        showBackdrop: false,
        componentProps: { group }
      });

      facilityGroupActionsPopover.present();

      const result = await facilityGroupActionsPopover.onDidDismiss();
      if (result.data && result.data !== group.facilityGroupName) {
        try {
          const resp = await FacilityService.updateFacilityGroup({
            facilityGroupId: group.facilityGroupId,
            facilityGroupName: result.data
          })

          if (!hasError(resp)) {
            showToast(translate('Facility group renamed.'))
            const updatedGroups = JSON.parse(JSON.stringify(this.groups))
              .map((groupData: any) => {
                if (group.facilityGroupId === groupData.facilityGroupId) {
                  groupData.facilityGroupName = result.data
                }

                return groupData
              })
            this.store.dispatch('facility/updateFacilityGroups', updatedGroups)
          } else {
            throw resp.data
          }
        } catch (error) {
          showToast(translate('Failed to rename facility group.'))
          logger.error('Failed to rename facility group.', error)
        }
      }
    },
    getAvailableFacilityGroups(facilityGroups: any) {
      const updatedFacilityGroups = JSON.parse(JSON.stringify(facilityGroups))

      this.groups.map((group: any) => {
        if(!group.facilityGroupTypeId) {
          updatedFacilityGroups.push(group.facilityGroupId)
        }
      })

      return updatedFacilityGroups
    },
    async updateFacilityGroupAssociation(event: CustomEvent, prevAssociatedGroups: any, facilityGroupTypeId: string) {
      const selectedGroups = event.detail.value
      const groupsToAdd = selectedGroups.filter((selectedGroupId: string) => !prevAssociatedGroups.includes(selectedGroupId))
      const groupsToRemove = prevAssociatedGroups.filter((prevGroupId: string) => !selectedGroups.includes(prevGroupId))
      const updateGroupPayloads = [] as any

      if(!(groupsToAdd.length || groupsToRemove.length)) {
        return;
      }

      emitter.emit('presentLoader')

      groupsToAdd.map((facilityGroupId: any) => updateGroupPayloads.push({facilityGroupId, facilityGroupTypeId}))
      groupsToRemove.map((facilityGroupId: any) => updateGroupPayloads.push({facilityGroupId, facilityGroupTypeId: ''}))

      const responses = await Promise.allSettled(updateGroupPayloads
        .map(async (payload: any) => await FacilityService.updateFacilityGroup(payload))
      )

      const hasFailedResponse = responses.some((response: any) => response.status === 'rejected')
      if (hasFailedResponse) {
        showToast(translate("Failed to associate group with system group types."))
      } else {
        showToast(translate("Group associated to system group types."))
      }

      await this.fetchGroups()
      await this.store.dispatch('util/fetchFacilityGroupTypes')
      emitter.emit('dismissLoader')
    },
    getFacilityGroupName(groupId: string) {
      return this.groups.find((group: any) => group.facilityGroupId === groupId).facilityGroupName
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      customSort,
      ellipsisVerticalOutline,
      router,
      store,
      translate
    };
  }
});
</script>

<style scoped>
.list-item {
  --columns-desktop: 4;
}

.groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start; 
}
</style>