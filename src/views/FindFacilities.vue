<template>
  <ion-page>
    <FacilityFilters content-id="filter-content" />

    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Find Facilities") }}</ion-title>
        <ion-buttons slot="end" class="mobile-only">
          <ion-menu-button menu="end">
            <ion-icon :icon="filterOutline" />
          </ion-menu-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="contentRef" id="filter-content">
      <div class="find">
        <section class="search">
          <ion-searchbar :placeholder="translate('Search facilities')" v-model="query.queryString" @keyup.enter="updateQuery()" />
        </section>

        <aside class="filters">
          <ion-list>
            <ion-item lines="none">
              <ion-icon :icon="globeOutline" slot="start" />
              <ion-select :label="translate('Product Store')" interface="popover" v-model="query.productStoreId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="productStore.productStoreId" :key="index" v-for="(productStore, index) in productStores">{{ productStore.storeName ? productStore.storeName : productStore.productStoreId }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="businessOutline" slot="start" />
              <ion-select :label="translate('Type')" interface="popover" v-model="query.facilityTypeId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="facilityTypeId" :key="facilityTypeId" v-for="(type, facilityTypeId) in facilityTypes">
                  {{ type.description }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item lines="none">
              <ion-icon :icon="albumsOutline" slot="start" />
              <ion-select :label="translate('Group')" interface="popover" v-model="query.facilityGroupId" @ionChange="updateQuery()">
                <ion-select-option value="">{{ translate("All") }}</ion-select-option>
                <ion-select-option :value="group.facilityGroupId" :key="group.facilityGroupId" v-for="group in facilityGroups">
                  {{ group.facilityGroupName }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-list>
        </aside>

        <main v-if="facilities?.length">
          <div class="list-item" v-for="(facility, index) in facilities" :key="index" @click="viewFacilityDetails(facility.facilityId)">
            <ion-item lines="none">
              <ion-icon slot="start" :icon="facilityTypes[facility.facilityTypeId]?.parentTypeId === 'DISTRIBUTION_CENTER' ? businessOutline : storefrontOutline" />
              <ion-label class="ion-text-wrap">
                <p class="overline">{{ facility.facilityTypeId ? facilityTypes[facility.facilityTypeId] ? facilityTypes[facility.facilityTypeId].description : facilityTypes.facilityTypeId : '' }}</p>
                {{ facility.facilityName }}
                <p>{{ facility.facilityId }}</p>
              </ion-label>
            </ion-item>

            <div class="tablet">
              <ion-chip outline @click.stop="openSellOnlineGroupPopover($event, facility)">
                <ion-label>{{ translate('Sell Online') }}</ion-label>
                <ion-icon :icon="shareOutline" :color="facility.sellOnline ? 'primary' : ''"/>
              </ion-chip>
            </div>

            <div class="tablet tablet-flex">
              <template v-if="facility.orderLimitType === 'custom'">
                <ion-chip outline @click.stop="changeOrderLimitPopover($event, facility)">
                  <ion-label>{{ facility.orderCount }} {{ '/' }} {{ facility.maximumOrderLimit }}</ion-label>
                </ion-chip>
                <ion-note>{{ translate('threshold consumed') }}</ion-note>
              </template>

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

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button>
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
        <ion-fab-list side="top">
          <ion-fab-button @click="router.push('/create-facility?type=PHYSICAL_STORE')">
            <ion-icon :icon="storefrontOutline" />
          </ion-fab-button>
          <ion-fab-button @click="router.push('/create-facility?type=DISTRIBUTION_CENTER')">
            <ion-icon :icon="businessOutline" />
          </ion-fab-button>
        </ion-fab-list>
      </ion-fab>
        <!--
        When searching for a keyword, and if the user moves to the last item, then the didFire value inside infinite scroll becomes true and thus the infinite scroll does not trigger again on the same page(https://github.com/hotwax/users/issues/84).
        Also if we are at the section that has been loaded by infinite-scroll and then move to the details page then the list infinite scroll does not work after coming back to the page
        In ionic v7.6.0, an issue related to infinite scroll has been fixed that when more items can be added to the DOM, but infinite scroll does not fire as the window is not completely filled with the content(https://github.com/ionic-team/ionic-framework/issues/18071).
        The above fix in ionic 7.6.0 is resulting in the issue of infinite scroll not being called again.
        To fix this we have maintained another variable `isScrollingEnabled` to check whether the scrolling can be performed or not.
        If we do not define an extra variable and just use v-show to check for `isScrollable` then when coming back to the page infinite-scroll is called programatically.
        We have added an ionScroll event on ionContent to check whether the infiniteScroll can be enabled or not by toggling the value of isScrollingEnabled whenever the height < 0.
        -->
      <ion-infinite-scroll
        @ionInfinite="loadMoreFacilities($event)"
        threshold="100px"
        v-if="isScrollable"
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
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonNote,
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
  addOutline,
  albumsOutline,
  businessOutline,
  filterOutline,
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
import { showToast, updateFacilityGroup } from '@/utils';
import logger from '@/logger';
import FacilityFilters from '@/components/FacilityFilters.vue'
import SellOnlineGroupPopover from '@/components/SellOnlineGroupPopover.vue'

export default defineComponent({
  name: 'FindFacilities',
  components: {
    FacilityFilters,
    IonButtons,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonFabList,
    IonHeader,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonMenuButton,
    IonNote,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonTitle,
    IonToolbar
  },
  data() {
    return {
      facilityGroups: [] as any,
    }
  },
  computed: {
    ...mapGetters({
      facilities: "facility/getFacilities",
      query: "facility/getFacilityQuery",
      isScrollable: "facility/isFacilitiesScrollable",
      facilityTypes: "util/getFacilityTypes",
      productStores: "util/getProductStores",
      inventoryGroups: "util/getInventoryGroups"
    })
  },
  async mounted() {
    // We only need to fetch those types whose parent is not virtual facility
    await Promise.all([this.store.dispatch('util/fetchFacilityTypes', { parentTypeId: 'VIRTUAL_FACILITY', parentTypeId_op: 'notEqual', facilityTypeId: 'VIRTUAL_FACILITY', facilityTypeId_op: 'notEqual' }), this.store.dispatch('util/fetchProductStores')])
  },
  async ionViewWillEnter() {
    // fetching facilities information in the ionViewWillEnter hook as when updating facilityGroup or fulfillment limit
    // from the details page and again coming to the list page, the UI does not gets updated when fetching information in
    // the mounted hook
    await this.fetchFacilityGroups();
    await this.store.dispatch('util/fetchInventoryGroups')
    if(this.router.currentRoute.value?.query?.productStoreId) {
      this.query.productStoreId = this.router.currentRoute.value.query.productStoreId
      await this.store.dispatch('facility/updateFacilityQuery', this.query)
    }
    await this.fetchFacilities();
  },
  methods: {
    async updateQuery() {
      await this.store.dispatch('facility/updateFacilityQuery', this.query)
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
      ).then(async () => {
        await event.target.complete();
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

        if (!hasError(resp)) {
          // updating the facilities state instead of refetching
          const updatedFacilities = JSON.parse(JSON.stringify(this.facilities)).map((facilityData: any) => {
            if (facility.facilityId === facilityData.facilityId) {
              facilityData.maximumOrderLimit = maximumOrderLimit === "" ? null : maximumOrderLimit
              facilityData.orderLimitType = facilityData.maximumOrderLimit === null ? 'unlimited' : (facilityData.maximumOrderLimit === 0 ? 'no-capacity' : 'custom')
            }
            return facilityData
          })
          this.store.dispatch('facility/updateFacilities', updatedFacilities)
          showToast(translate('Fulfillment capacity updated successfully for ', { facilityName: facility.facilityName }))
        } else {
          throw resp.data
        }
      } catch(err) {
        showToast(translate('Failed to update fulfillment capacity for ', { facilityName: facility.facilityName }))
        logger.error('Failed to update facility', err)
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

        if (!hasError(resp) && resp.data?.docs?.length > 0) {
          this.facilityGroups = resp.data.docs;
        } else {
          throw resp.data
        }
      } catch (err) {
        logger.error('Failed to find facility groups', err)
      }
    },
    async openSellOnlineGroupPopover(ev: Event, facility: any) {
      if(this.inventoryGroups.length === 1) {
        const isGroupAdded = !facility.groupInformation.some((info: any) => info.facilityGroupId === this.inventoryGroups[0].facilityGroupId);
        await updateFacilityGroup(facility, this.inventoryGroups[0], isGroupAdded);
      } else {
        const popover = await popoverController.create({
          component: SellOnlineGroupPopover,
          event: ev,
          showBackdrop: false,
          componentProps: { facility: facility }
        });
        popover.present();
      }
    }
  },
  setup() {
    const router = useRouter();
    const store = useStore();

    return {
      addOutline,
      albumsOutline,
      businessOutline,
      filterOutline,
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
.tablet-flex{
  display: flex;
  align-items: end;
  flex-direction: column;
}

@media screen and (min-width: 991px) {
  ion-content {
    --padding-bottom: 80px;
  }
}
</style>