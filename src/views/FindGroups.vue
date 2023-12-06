<template>
  <ion-page>
    <Filters content-id="filter-content" />

    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/" />
        <ion-title>{{ translate("Groups") }}</ion-title>
        <ion-buttons slot="end" class="mobile-only">
          <ion-menu-button menu="end">
            <ion-icon :icon="filterOutline" />
          </ion-menu-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content id="filter-content">
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search groups')" />
        </section>

        <main>
          <div class="groups">
            <ion-card v-for="(group, index) in groups" :key="index">
              <ion-item lines="full">
                <ion-label>
                  {{ group.facilityGroupName }}
                  <p>{{ group.facilityGroupId }}</p>
                </ion-label>
                <ion-icon :icon="ellipsisVerticalOutline" slot="end"/>
              </ion-item>
              <ion-item>
                <ion-label>{{ translate('Facilities') }}</ion-label>
                <ion-note slot="end">{{ 'count' }}</ion-note>
              </ion-item>
              <ion-item lines="full" v-if="group.description">
                <ion-label>{{ group.description }}</ion-label>
              </ion-item>
            </ion-card> 
          </div>   
        </main>
        <!-- <main v-else>
          <p class="ion-text-center">{{ translate("No groups found") }}</p>
        </main> -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonMenuButton,
  IonNote,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { defineComponent } from 'vue';
import { ellipsisVerticalOutline, filterOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'
import Filters from '@/components/Filters.vue'

export default defineComponent({
  name: 'FindGroups',
  components: {
    Filters,
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonMenuButton,
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
    })
  },
  async mounted() {
    await this.fetchGroups();
  },
  methods: {
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
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      ellipsisVerticalOutline,
      filterOutline,
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