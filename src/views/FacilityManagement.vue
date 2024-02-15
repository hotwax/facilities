<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ translate("Facility Management") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <main>
        <ion-card button @click="router.push('/find-facilities')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="businessOutline"/>
            <h1>{{ translate("Facilities") }}</h1>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Stores') }}</ion-label>
            <ion-note slot="end">{{ physicalStoresCount }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Warehouses') }}</ion-label>
            <ion-note slot="end">{{ warehouseCount }}</ion-note>
          </ion-item>
        </ion-card>

        <ion-card button @click="router.push('/parking')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="golfOutline"/>
            <h1>{{ translate("Parking") }}</h1>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Brokering queue') }}</ion-label>
            <ion-note slot="end">{{ brokeringQueueOrderCount }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Backorder parking') }}</ion-label>
            <ion-note slot="end">{{ backorderParkingOrderCount }}</ion-note>
          </ion-item>
        </ion-card>

        <ion-card button @click="router.push('/find-groups')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="albumsOutline"/>
            <h1>{{ translate("Groups") }}</h1>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Pickup facilities') }}</ion-label>
            <ion-note slot="end">{{ pickupFacilitiesCount }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>{{ translate('Online facilities') }}</ion-label>
            <ion-note slot="end">{{ onlineFacilitiesCount }}</ion-note>
          </ion-item>
        </ion-card>

        <ion-card button @click="router.push('/settings')">
          <ion-item lines="none">
            <ion-icon slot="start" :icon="settingsOutline"/>
            <h1>{{ translate("Settings") }}</h1>
          </ion-item>
          <ion-item>
            <ion-label>{{ userProfile?.partyName }}</ion-label>
            <ion-note slot="end">{{ userProfile?.userLoginId }}</ion-note>
          </ion-item>
          <ion-item>
            <ion-label>{{ instanceUrl }}</ion-label>
          </ion-item>
        </ion-card>
      </main>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonCard,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { defineComponent } from 'vue';
import {
  albumsOutline,
  businessOutline,
  golfOutline,
  settingsOutline
} from 'ionicons/icons';
import { useRouter } from 'vue-router';
import { translate } from '@hotwax/dxp-components'
import logger from '@/logger';
import { FacilityService } from '@/services/FacilityService';
import { mapGetters } from 'vuex';

export default defineComponent({
  name: 'FacilityManagement',
  components: {
    IonCard,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      userProfile: 'user/getUserProfile',
      instanceUrl: 'user/getInstanceUrl',
    })
  },
  data() {
    return {
      warehouseCount: 0,
      physicalStoresCount: 0,
      brokeringQueueOrderCount: 0,
      backorderParkingOrderCount: 0,
      pickupFacilitiesCount: 0,
      onlineFacilitiesCount: 0
    }
  },
  async ionViewWillEnter() {
    await Promise.all([this.fetchFacilityTypeCount(), this.fetchOrderCountByParking(), this.fetchFacilitiesCountByGroup()])
  },
  methods: {
    async fetchFacilityTypeCount() {
      const warehouseTypePayload = {
        "inputFields": {
          'parentFacilityTypeId': 'DISTRIBUTION_CENTER',
        },
        "entityName": "FacilityAndProductStore",
        "distinct": "Y",
        "fieldList": ['facilityId', 'facilityName', 'facilityTypeId'],
        "viewSize": 1
      }
  
      const physicalStoreTypePayload = {
        "inputFields": {
          'parentFacilityTypeId': 'PHYSICAL_STORE',
        },
        "entityName": "FacilityAndProductStore",
        "distinct": "Y",
        "fieldList": ['facilityId', 'facilityName', 'facilityTypeId'],
        "viewSize": 1
      }

      try {
        const responses = await Promise.allSettled([
          FacilityService.fetchFacilities(warehouseTypePayload),
          FacilityService.fetchFacilities(physicalStoreTypePayload)
        ])

        // Not checking for error in responses as in case of error we simply will not have 'count' property in response and we will display 0 as the count
        // Also, if checking for error then we need to check both the apis separately as there may be a case in which only one api fails
        const [warehousesResponse, physicalStoresResponse] = responses.map((response: any) => response.value);
        this.warehouseCount = warehousesResponse.data.count || 0
        this.physicalStoresCount = physicalStoresResponse.data.count || 0
      } catch (error) {
        logger.error('Failed to fetch facility types count', error)
      }
    },
    async fetchOrderCountByParking() {
      try {
        const parkingsOrderCount = await FacilityService.fetchOrderCountsByFacility(['_NA_', 'BACKORDER_PARKING'])
        this.brokeringQueueOrderCount = parkingsOrderCount['_NA_'] || 0
        this.backorderParkingOrderCount = parkingsOrderCount['BACKORDER_PARKING'] || 0
      } catch (error) {
        logger.error('Failed to fetch facility types count', error)
      }
    },
    async fetchFacilitiesCountByGroup() {
      try {
        const groupsFacilityCount = await FacilityService.fetchFacilityCountByGroup(['PICKUP', 'FAC_GRP'])
        this.pickupFacilitiesCount = groupsFacilityCount['PICKUP'] || 0
        this.onlineFacilitiesCount = groupsFacilityCount['FAC_GRP'] || 0
      } catch (error) {
        logger.error('Failed to fetch facility count for groups', error)
      }
    },
  },
  setup() {
    const router = useRouter();

    return {
      albumsOutline,
      businessOutline,
      golfOutline,
      settingsOutline,
      translate,
      router
    };
  }
});
</script>

<style scoped>

ion-card {
  border-radius: 8px;
  transition: box-shadow 200ms ease;
}

ion-card:hover {
  box-shadow: 0px 8px 10px 0px rgba(0, 0, 0, 0.20), 0px 6px 30px 0px rgba(0, 0, 0, 0.12), 0px 16px 24px 0px rgba(0, 0, 0, 0.14);
}

ion-item > h1 {
  margin: unset;
}

main {
  display: grid;
  place-content: center;
  grid-template-columns: repeat(auto-fill, minmax(300px, 343px));
  height: calc(100vh - 56px);
  max-width: 1000px;
  margin: auto;
}

ion-card-header {
  display: flex;
  justify-content: start;
}

@media screen and (min-width: 700px) {

  main {
    padding: var(--spacer-lg);

  }

}


</style>