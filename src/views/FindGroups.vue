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
                {{ groupType.description ? groupType.description : groupType.facilityGroupTypeId }}
              </ion-label>
              <ion-select v-if="groups.length" :placeholder="translate('Select')" :selectedText="getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId).length > 1 ? translate('groups', { count: getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId).length }) : getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId)[0]" :value="getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId)" @ionChange="updateFacilityGroupAssociation($event, getAssociatedFacilityGroupIds(groupType.facilityGroupTypeId), groupType.facilityGroupTypeId)" :multiple="true">
                <ion-select-option :value="group.facilityGroupId" :disabled="group.facilityGroupTypeId && group.facilityGroupTypeId !== groupType.facilityGroupTypeId" :key="group.facilityGroupId" v-for="group in groups">
                  {{ group.facilityGroupName ? group.facilityGroupName : group.facilityGroupId }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </section>

        <main v-if="groups.length">
          <!-- custom sorting in the UI to keep OMS_FULFILLMENT and PICKUP types first -->
          <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
            <ion-item lines="full">
              <ion-label>
                <h1>{{ group.facilityGroupName }}</h1>
                <p>{{ group.facilityGroupId }}</p>
              </ion-label>
              <ion-badge slot="end">{{ group.facilityGroupTypeId }}</ion-badge>
              <ion-button @click="openFacilityGroupActionsPopover($event, group)" fill="clear" color="medium" slot="end">
                <ion-icon :icon="ellipsisVerticalOutline" slot="icon-only"/>
              </ion-button>
            </ion-item>
            <ion-item>
              <ion-label>{{ translate('Facilities') }}</ion-label>
              <ion-chip outline slot="end" @click="openGroupActionsPopover($event, group)">
                {{ group.facilityCount }}
              </ion-chip>
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
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
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
import GroupActionsPopover from '@/components/GroupActionsPopover.vue';

export default defineComponent({
  name: 'FindGroups',
  components: {
    IonButton,
    IonBackButton,
    IonBadge,
    IonCard,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
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
    async openGroupActionsPopover(event: Event, group: any) {
      const groupActionsPopover = await popoverController.create({
        component: GroupActionsPopover,
        event,
        showBackdrop: false,
        componentProps: { group }
      });

      groupActionsPopover.present();
    },
    getAssociatedFacilityGroupIds(facilityGroupTypeId: any) {
      const associatedfacilityGroupIds = [] as any

      this.groups.map((group: any) => {
        if(group.facilityGroupTypeId && group.facilityGroupTypeId === facilityGroupTypeId) {
          associatedfacilityGroupIds.push(group.facilityGroupId)
        }
      })
      return associatedfacilityGroupIds
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
      emitter.emit('dismissLoader')
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

main:has(ion-card) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start;
}
</style>