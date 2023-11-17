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

    <ion-fab @click="saveProductStores()" vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button>
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
import { mapGetters } from "vuex";

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
      productStores: 'util/getProductStores'
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
    saveProductStores() {
      const productStoresToCreate = this.selectedProductStoreValues.filter((selectedFacility: any) => !this.selectedProductStores.some((facility: any) => facility.facilityId === selectedFacility.facilityId))
      const productStoresToRemove = this.selectedProductStores.filter((facility: any) => !this.selectedProductStoreValues.some((selectedFacility: any) => facility.facilityId === selectedFacility.facilityId))

      modalController.dismiss({
        dismissed: true,
        value: {
          selectedProductStores: this.selectedProductStoreValues,
          productStoresToCreate,
          productStoresToRemove
        }
      });
    },
    toggleProductStoreSelection(updatedStore: any) {
      let selectedStore = this.selectedProductStoreValues.some((store: any) => store.productStoreId === updatedStore.productStoreId);
      if (selectedStore) {
        this.selectedProductStoreValues = this.selectedProductStoreValues.filter((store: any) => store.productStoreId !== updatedStore.productStoreId);
      } else {
        this.selectedProductStoreValues.push(updatedStore);
      }
    },
    isSelected (productStoreId: any) {
      return this.selectedProductStoreValues.some((productStore: any) => productStore.productStoreId === productStoreId);
    }
  },
  setup() {
    return {
      closeOutline,
      saveOutline,
      translate
    };
  },
});
</script>
    