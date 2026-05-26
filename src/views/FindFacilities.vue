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
        <div class="sidebar">
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
        </div>

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

            <div class="tablet">
              <template v-if="facility.orderLimitType === 'custom'">
                <ion-chip outline @click.stop="changeOrderLimitPopover($event, facility)">
                  <ion-label>{{ facility.orderCount }} {{ '/' }} {{ facility.maximumOrderLimit }}</ion-label>
                </ion-chip>
                <ion-note class="config-label">{{ translate('threshold consumed') }}</ion-note>
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

<script setup lang="ts">
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
import { computed, onMounted, ref } from 'vue';
import { commonUtil, translate } from "@common"
import OrderLimitPopover from '@/components/OrderLimitPopover.vue'
import { FacilityService } from '@/services/FacilityService'
import { updateFacilityGroup } from '@/utils';
import logger from '@/logger';
import FacilityFilters from '@/components/FacilityFilters.vue'
import SellOnlineGroupPopover from '@/components/SellOnlineGroupPopover.vue'
import { useFacilityStore } from '@/store/facility';
import { useUtilStore } from '@/store/util';
import { onIonViewWillEnter } from '@ionic/vue';
import router from '@/router';

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const facilityGroups = ref([] as any);

const facilities = computed(() => facilityStore.getFacilities);
const query = computed(() => facilityStore.getFacilityQuery);
const isScrollable = computed(() => facilityStore.isFacilitiesScrollable);
const facilityTypes = computed(() => utilStore.getFacilityTypes);
const productStores = computed(() => utilStore.getProductStores);
const inventoryGroups = computed(() => utilStore.getInventoryGroups);

onMounted(async () => {
  await Promise.all([
    utilStore.fetchFacilityTypes({ 
      parentTypeId: 'VIRTUAL_FACILITY', 
      parentTypeId_not: 'Y', 
      facilityTypeId: 'VIRTUAL_FACILITY', 
      facilityTypeId_not: 'Y' 
    }), 
    utilStore.fetchProductStores()
  ]);
});

onIonViewWillEnter(async () => {
  await fetchFacilityGroups();
  await utilStore.fetchInventoryGroups();
  if (router.currentRoute.value?.query?.productStoreId) {
    query.value.productStoreId = router.currentRoute.value.query.productStoreId;
    await facilityStore.updateFacilityQuery(query.value);
  }
  await fetchFacilities();
});

async function updateQuery() {
  await facilityStore.updateFacilityQuery(query.value);
  await fetchFacilities();
}

async function fetchFacilities(vSize?: any, vIndex?: any) {
  const pageSize = vSize ? vSize : import.meta.env.VITE_APP_VIEW_SIZE;
  const pageIndex = vIndex ? vIndex : 0;
  const payload = {
    pageSize,
    pageIndex
  };
  await facilityStore.fetchFacilities(payload);
}

function viewFacilityDetails(facilityId: string) {
  router.push({ path: `/facility-details/${facilityId}` });
}

async function loadMoreFacilities(event: any) {
  await fetchFacilities(
    undefined,
    Math.ceil(
      facilities.value?.length / (import.meta.env.VITE_APP_VIEW_SIZE as any)
    ).toString()
  );
  await event.target.complete();
}

async function changeOrderLimitPopover(ev: Event, facility: any) {
  const popover = await popoverController.create({
    component: OrderLimitPopover,
    event: ev,
    showBackdrop: false,
    componentProps: { fulfillmentOrderLimit: facility.maximumOrderLimit }
  });
  popover.present();

  const result = await popover.onDidDismiss();
  if (result.data != undefined && result.data !== facility.maximumOrderLimit) {
    await updateFacility(result.data, facility);
  }
}

async function updateFacility(maximumOrderLimit: number | string, facility: any) {
  try {
    const resp = await FacilityService.updateFacility({
      "facilityId": facility.facilityId,
      maximumOrderLimit
    });

    if (!commonUtil.hasError(resp)) {
      const updatedFacilities = JSON.parse(JSON.stringify(facilities.value)).map((facilityData: any) => {
        if (facility.facilityId === facilityData.facilityId) {
          facilityData.maximumOrderLimit = maximumOrderLimit === "" ? null : maximumOrderLimit;
          facilityData.orderLimitType = facilityData.maximumOrderLimit === null ? 'unlimited' : (facilityData.maximumOrderLimit === 0 ? 'no-capacity' : 'custom');
        }
        return facilityData;
      });
      facilityStore.updateFacilities(updatedFacilities);
      commonUtil.showToast(translate('Fulfillment capacity updated successfully for ', { facilityName: facility.facilityName }));
    } else {
      throw resp.data;
    }
  } catch (err) {
    commonUtil.showToast(translate('Failed to update fulfillment capacity for ', { facilityName: facility.facilityName }));
    logger.error('Failed to update facility', err);
  }
}

async function fetchFacilityGroups() {
  const params = {
    orderByField: "facilityGroupTypeId ASC",
    pageNoLimit: true
  };

  try {
    const resp = await facilityStore.fetchFacilityGroups(params);
    if (resp.data?.length > 0) {
      facilityGroups.value = resp.data;
    } else {
      throw resp.data;
    }
  } catch (err) {
    logger.error('Failed to find facility groups', err);
  }
}

async function openSellOnlineGroupPopover(ev: Event, facility: any) {
  if (inventoryGroups.value.length === 1) {
    const isGroupAdded = !facility.groupInformation.some((info: any) => info.facilityGroupId === inventoryGroups.value[0].facilityGroupId);
    await updateFacilityGroup(facility, inventoryGroups.value[0], isGroupAdded);
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
</script>

<style scoped>
.list-item {
  --columns-desktop: 4;
}

config-note {
  display: block;
  text-align: center;
}

.sidebar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--ion-background-color, #fff);
  border-bottom: 1px solid var(--ion-color-light-shade, #f4f5f8);
}

@media screen and (min-width: 991px) {
  ion-content {
    --padding-bottom: 80px;
  }
}
</style>