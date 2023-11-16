<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/" />
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
              <div class="ion-text-center" v-if="facility.orderLimitType === 'custom'">
                <ion-chip outline @click.stop="changeOrderLimitPopover($event, facility)">
                  <ion-label>{{ facility.orderCount }} {{ '/' }} {{ facility.maximumOrderLimit }}</ion-label>
                </ion-chip>
                <p>{{ translate('threshold consumed') }}</p>
              </div>
              <ion-chip outline v-else-if="facility.orderLimitType === 'unlimited'" @click.stop="changeOrderLimitPopover($event, facility)">
                <ion-label>{{ translate("Unlimited orders") }}</ion-label>
                <ion-icon :icon="lockOpenOutline"/>
              </ion-chip>
              <ion-chip outline v-else @click.stop="changeOrderLimitPopover($event, facility)">
                <ion-label>{{ translate("No capacity") }}</ion-label>
                <ion-icon :icon="lockClosedOutline"/>
              </ion-chip>
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
  IonBackButton,
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
  IonToolbar,
  popoverController
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  businessOutline,
  globeOutline,
  lockClosedOutline,
  lockOpenOutline,
  shareOutline,
  storefrontOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'
import OrderLimitPopover from '@/components/OrderLimitPopover.vue'
import { hasError } from '@/adapter';
import { FacilityService } from '@/services/FacilityService'
import { showToast } from '@/utils';
import logger from '@/logger';

export default defineComponent({
  name: 'FindFacilities',
  components: {
    IonBackButton,
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
    // We only need to fetch those types whose parent is not virtual facility
    await Promise.all([this.store.dispatch('util/fetchFacilityTypes', { parentTypeId: 'VIRTUAL_FACILITY', parentTypeId_op: 'notEqual', facilityTypeId: 'VIRTUAL_FACILITY', facilityTypeId_op: 'notEqual' }), this.store.dispatch('util/fetchProductStores')])
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
    async changeOrderLimitPopover(ev: Event, facility: any) {
      const popover = await popoverController.create({
        component: OrderLimitPopover,
        event: ev,
        showBackdrop: false,
        componentProps: { fulfillmentOrderLimit: facility.maximumOrderLimit }
      });
      popover.present();

      const result = await popover.onDidDismiss();
      // Note: here result.data returns 0 in some cases that's why it is compared with 'undefined'.
      if(result.data != undefined && result.data !== facility.maximumOrderLimit) {
        await this.updateFacility(result.data, facility)
      }
    },
    async updateFacility(maximumOrderLimit: number | string, facility: any) {
      let resp;

      try {
        resp = await FacilityService.updateFacility({
          "facilityId": facility.facilityId,
          maximumOrderLimit
        })

        if(!hasError(resp)) {
          facility.maximumOrderLimit = maximumOrderLimit === "" ? null : maximumOrderLimit
          showToast(translate('Fulfillment capacity updated successfully for ', { facilityName: facility.facilityName }))
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update fulfillment capacity for ', { facilityName: facility.facilityName }))
        logger.error('Failed to update facility', err)
      }
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      businessOutline,
      globeOutline,
      lockClosedOutline,
      lockOpenOutline,
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