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
            <ion-select-option :value="productStore.productStoreId" :key="index" v-for="(productStore, index) in productStores">{{ productStore.storeName || productStore.productStoreId }}</ion-select-option>
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

<script setup lang="ts">
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
import { translate } from "@common"
import { useFacilityStore } from "@/store/facility";
import { useUtilStore } from "@/store/util";
import { computed } from 'vue';

const facilityStore = useFacilityStore();
const utilStore = useUtilStore();

const query = computed(() => facilityStore.getFacilityQuery);
const facilityTypes = computed(() => utilStore.getFacilityTypes);
const productStores = computed(() => utilStore.getProductStores);

function closeMenu() {
  menuController.close();
}

async function updateQuery() {
  await facilityStore.updateFacilityQuery(query.value);
  closeMenu();
}
</script>