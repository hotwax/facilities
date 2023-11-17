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
        <ion-checkbox slot="end" :checked="isSelected(productStore.productStoreId)" />
      </ion-item>
    </ion-list>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
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
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    isSelected (productStoreId: any) {
      return this.selectedProductStores.some((productStore :any) => productStore.productStoreId === productStoreId);
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
    