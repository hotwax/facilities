<template>
  <ion-menu type="overlay" side="end">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ translate("Filters") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item lines="none">
          <ion-icon :icon="globeOutline" slot="start" />
          <ion-select :label="translate('Product Store')" interface="popover" v-model="query.productStoreId" @ionChange="updateQuery()">
            <ion-select-option value="">{{ translate("All") }}</ion-select-option>
            <ion-select-option :value="productStore.productStoreId" :key="index" v-for="(productStore, index) in productStores">{{ productStore.storeName }}</ion-select-option>
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
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script lang="ts">
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonMenu,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
  menuController
} from '@ionic/vue'
import { businessOutline, globeOutline } from 'ionicons/icons'
import { defineComponent } from 'vue';
import { mapGetters, useStore } from 'vuex';
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: 'FacilityFilters',
  components: {
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonList,
    IonMenu,
    IonTitle,
    IonToolbar,
    IonSelect,
    IonSelectOption
  },
  computed: {
    ...mapGetters({
      query: "facility/getFacilityQuery",
      facilityTypes: "util/getFacilityTypes",
      productStores: "util/getProductStores"
    })
  },
  methods: {
    closeMenu() {
      menuController.close()
    },
    async updateQuery() {
      await this.store.dispatch('facility/updateFacilityQuery', this.query)
      this.closeMenu();
    },
  },
  setup() {
    const store = useStore();

    return {
      businessOutline,
      globeOutline,
      store,
      translate
    };    
  }
})
</script>