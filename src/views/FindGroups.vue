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
        </section>
        <main class="groups" v-if="groups.length">
          <!-- custom sorting in the UI to keep OMS_FULFILLMENT and PICKUP types first -->
          <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
            <ion-item lines="full">
              <ion-label>
                <h1>{{ group.facilityGroupName }}</h1>
                <p>{{ group.facilityGroupId }}</p>
              </ion-label>
              <ion-button @click="openFacilityGroupActionsPopover($event, group)" fill="clear" color="medium" slot="end">
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
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonSearchbar,
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

export default defineComponent({
  name: 'FindGroups',
  components: {
    IonButton,
    IonBackButton,
    IonCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonSearchbar,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      groups: "facility/getFacilityGroups",
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