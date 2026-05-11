<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Select product stores") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-item v-for="productStore in productStores" :key="productStore.productStoreId">
        <ion-checkbox :checked="isSelected(productStore.productStoreId)" @ionChange="toggleProductStoreSelection(productStore)">
          <ion-label>
            {{ productStore.storeName }}
            <p>{{ productStore.productStoreId }}</p>
          </ion-label>
        </ion-checkbox>
      </ion-item>
    </ion-list>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="saveProductStores()">
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script setup lang="ts">
import { 
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { useUtilStore } from "@/store/util";
import { ref, computed } from "vue";

const props = defineProps(["selectedProductStores"]);
const utilStore = useUtilStore();

const productStores = computed(() => utilStore.getProductStores);

const selectedProductStoreValues = ref(JSON.parse(JSON.stringify(props.selectedProductStores)));

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

async function saveProductStores() {
  const productStoresToCreate = selectedProductStoreValues.value.filter((selectedStore: any) => !props.selectedProductStores.some((store: any) => store.productStoreId === selectedStore.productStoreId));
  const productStoresToRemove = props.selectedProductStores.filter((store: any) => !selectedProductStoreValues.value.some((selectedStore: any) => store.productStoreId === selectedStore.productStoreId));

  modalController.dismiss({
    dismissed: true,
    value: {
      selectedProductStores: selectedProductStoreValues.value,
      productStoresToCreate,
      productStoresToRemove
    }
  });
}

function toggleProductStoreSelection(updatedStore: any) {
  const isCurrentlySelected = selectedProductStoreValues.value.some((store: any) => store.productStoreId === updatedStore.productStoreId);
  if (isCurrentlySelected) {
    selectedProductStoreValues.value = selectedProductStoreValues.value.filter((store: any) => store.productStoreId !== updatedStore.productStoreId);
  } else {
    selectedProductStoreValues.value.push(updatedStore);
  }
}

function isSelected(productStoreId: string) {
  return selectedProductStoreValues.value.some((productStore: any) => productStore.productStoreId === productStoreId);
}
</script>