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
        <ion-label>
          {{ productStore.storeName }}
          <p>{{ productStore.productStoreId }}</p>
        </ion-label>
        <ion-checkbox slot="end" :checked="isSelected(productStore.productStoreId)" @ionChange="toggleProductStoreSelection(productStore)" />
      </ion-item>
    </ion-list>
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="saveProductStores()">
        <ion-icon :icon="saveOutline" />  
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
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
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
import { mapGetters, useStore } from "vuex";

export default defineComponent({
  name: "SelectProductStoreModal",
  components: { 
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
    IonToolbar
  },
  computed: {
    ...mapGetters({
      productStores: 'util/getProductStores',
      facilityProductStores: 'facility/getFacilityProductStores',
    })
  },
  props: ["selectedProductStores"],
  data() {
    return {
      selectedProductStoreValues: JSON.parse(JSON.stringify(this.selectedProductStores)),
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    async saveProductStores() {
      const productStoresToCreate = this.selectedProductStoreValues.filter((selectedStore: any) => !this.selectedProductStores.some((store: any) => store.productStoreId === selectedStore.productStoreId))
      const productStoresToRemove = this.selectedProductStores.filter((store: any) => !this.selectedProductStoreValues.some((selectedStore: any) => store.productStoreId === selectedStore.productStoreId))

      modalController.dismiss({
        dismissed: true,
        value: {
          selectedProductStores: this.selectedProductStoreValues,
          productStoresToCreate,
          productStoresToRemove
        }
      });

      modalController.dismiss()
    },
    toggleProductStoreSelection(updatedStore: any) {
      let selectedStore = this.selectedProductStoreValues.some((store: any) => store.productStoreId === updatedStore.productStoreId);
      if(selectedStore) {
        this.selectedProductStoreValues = this.selectedProductStoreValues.filter((store: any) => store.productStoreId !== updatedStore.productStoreId);
      } else {
        this.selectedProductStoreValues.push(updatedStore);
      }
    },
    isSelected(productStoreId: string) {
      return this.selectedProductStoreValues.some((productStore: any) => productStore.productStoreId === productStoreId);
    }
  },
  setup() {
    const store = useStore()

    return {
      closeOutline,
      saveOutline,
      store,
      translate
    };
  },
});
</script>
    