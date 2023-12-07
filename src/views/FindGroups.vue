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
        <main v-if="groups.length">
          <div class="groups">
            <!-- custom sorting in the UI to keep OMS_FULFILLMENT and PICKUP types first -->
            <ion-card v-for="(group, index) in customSort(groups, ['OMS_FULFILLMENT', 'PICKUP'], 'facilityGroupId')" :key="index">
              <ion-item lines="full">
                <ion-label>
                  {{ group.facilityGroupName }}
                  <p>{{ group.facilityGroupId }}</p>
                </ion-label>
                <ion-icon :icon="ellipsisVerticalOutline" slot="end"/>
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
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { ellipsisVerticalOutline, addOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'
import { customSort } from '@/utils';
import CreateFacilityGroupModal from '@/components/CreateFacilityGroupModal.vue';

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