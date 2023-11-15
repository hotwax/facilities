<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Find Facilities") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search facilities')" v-model="query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="globeOutline" slot="start" />
              <ion-label>{{ translate("Product Store") }}</ion-label>
              <ion-select interface="popover" v-model="query.productStoreId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="productStore.productStoreId" :key="index" v-for="(productStore, index) in productStores">{{ productStore.storeName }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="businessOutline" slot="start" />
              <ion-label>{{ translate("Type") }}</ion-label>
              <ion-select interface="popover" v-model="query.facilityTypeId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="facilityType.facilityId" :key="index" v-for="(facilityType, index) in facilityTypes">{{ facilityType.description }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="facilities?.length">
          <div class="list-item" v-for="(facility, index) in facilities" :key="index" @click="viewFacilityDetails(facility.facilityId)">
            <ion-item lines="none">
              <ion-icon slot="start" :icon="storefrontOutline" />
              <ion-label>
                <p class="overline">{{ facility.facilityTypeId ? facility.facilityTypeId : '' }}</p>
                {{ facility.facilityName }}
                <p>{{ facility.facilityId }}</p>
              </ion-label>
            </ion-item>

            <div class="tablet">
              <ion-chip outline>
                <ion-label>{{ translate('Sell Online') }}</ion-label>
                <ion-icon :icon="shareOutline" :color="facility.sellOnline ? 'primary' : ''"/>
              </ion-chip>
            </div>

            <div class="tablet">
              <ion-label>
                {{ 'THRESHOLD CONSUMED' }}
              </ion-label>
            </div>
          </div>
        </main>
        <main v-else>
          <p class="ion-text-center">{{ translate("No facilities found") }}</p>
        </main>
      </div>

      <ion-infinite-scroll
        @ionInfinite="loadMoreFacilities($event)"
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
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  businessOutline,
  globeOutline,
  shareOutline,
  storefrontOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: 'FindFacilities',
  components: {
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      facilities: "facility/getFacilities",
      query: "facility/getQuery",
      isScrollable: "facility/isScrollable",
      facilityTypes: "util/getFacilityTypes",
      productStores: "util/getProductStores"
    })
  },
  async mounted() {
    await this.fetchFacilities();
    await Promise.all([this.store.dispatch('util/fetchFacilityTypes', { parentTypeId: 'VIRTUAL_FACILITY' }), this.store.dispatch('util/fetchProductStores')])
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('facility/updateQuery', this.query)
      this.fetchFacilities();
    },
    async fetchFacilities(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchFacilities', payload)
    },
    async viewFacilityDetails(facilityId: string) {
      this.router.push({ path: `/facility-details/${facilityId}` })
    },
    async loadMoreFacilities(event: any) {
      this.fetchFacilities(
        undefined,
        Math.ceil(
          this.facilities?.length / (process.env.VUE_APP_VIEW_SIZE as any)
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
      businessOutline,
      globeOutline,
      router,
      shareOutline,
      storefrontOutline,
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
</style>