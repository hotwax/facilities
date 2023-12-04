<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/"/>
        <ion-title>{{ translate("Parking") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <main>
        <section>
          <div class="virtual-facilities">
            <ion-card v-for="(facility, index) in virtualFacilities" :key="index">
              <ion-item lines="full">
                <ion-label>
                  {{ facility.facilityName }}
                  <p>{{ facility.facilityId }}</p>
                </ion-label>
                <ion-icon :icon="ellipsisVerticalOutline" slot="end"/>
              </ion-item>
              <template v-if="facility.facilityId === '_NA_'">
                <ion-item lines="full">
                  <ion-label>{{ translate('Pending allocation') }}</ion-label>
                  <ion-note slot="end">{{ facility.orderCount }}</ion-note>
                </ion-item>
                <ion-item lines="full">
                  <ion-label>{{ translate('Next brokering') }}</ion-label>
                  <ion-note slot="end">{{ facility?.brokeringJob?.runTime ? getDateTime(facility?.brokeringJob?.runTime) : '-' }}</ion-note>
                </ion-item>
              </template>
              <ion-item v-else>
                <ion-label>{{ translate('Orders') }}</ion-label>
                <ion-note slot="end">{{ facility.orderCount }}</ion-note>
              </ion-item>
              <ion-item lines="full" v-if="['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId)">
                <ion-label>{{ translate('Auto release') }}</ion-label>
                <ion-toggle :checked="facility.autoReleaseJob" :disabled="true" slot="end" />
              </ion-item>
              <ion-item lines="full" v-if="facility.description && !['BACKORDER', 'PRE_ORDER'].includes(facility.facilityTypeId) && facility.facilityId !== '_NA_'">
                <ion-label>{{ facility.description }}</ion-label>
              </ion-item>
            </ion-card> 
          </div>   
        </section>
      </main>
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
import { defineComponent } from 'vue';
import {
  IonBackButton,
  IonCard,
  IonContent,
  IonHeader, 
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/vue'
import { ellipsisVerticalOutline } from 'ionicons/icons'
import { translate } from '@hotwax/dxp-components';
import { mapGetters, useStore } from 'vuex';
import { DateTime } from 'luxon';

export default defineComponent({
  name: 'Parking',
  components: {
    IonBackButton,
    IonCard,
    IonContent,
    IonHeader, 
    IonIcon,
    IonItem,
    IonLabel,
    IonPage,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  computed: {
    ...mapGetters({
      virtualFacilities: 'facility/getVirtualFacilities',
      isScrollable: "facility/isScrollable",
    })
  },
  async mounted() {
    await this.fetchFacilities();
  },
  methods: {
    getDateTime(time: any) {
      return DateTime.fromMillis(time).toLocaleString(DateTime.DATETIME_MED);
    },
    async fetchFacilities(vSize?: any, vIndex?: any) {
      const viewSize = vSize ? vSize : process.env.VUE_APP_VIEW_SIZE;
      const viewIndex = vIndex ? vIndex : 0;
      const payload = {
        viewSize,
        viewIndex
      };
      await this.store.dispatch('facility/fetchVirtualFacilities', payload)
    },
    async loadMoreFacilities(event: any) {
      this.fetchFacilities(
        undefined,
        Math.ceil(
          this.virtualFacilities?.length / (process.env.VUE_APP_VIEW_SIZE as any)
        ).toString()
      ).then(() => {
        event.target.complete();
      });
    }
  },
  setup() {
    const store = useStore();

    return {
      ellipsisVerticalOutline,
      store,
      translate
    }
  }
});
</script>
<style scoped>
.virtual-facilities {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  align-items: start; 
}
</style>