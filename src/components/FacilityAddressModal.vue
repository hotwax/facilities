<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal()">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Address") }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-item>
      <ion-label>{{ translate("Address line 1") }}</ion-label>
      <ion-input v-model="postalAddress.address1" slot="end" />
    </ion-item>
    <ion-item class="ion-margin-bottom">
      <ion-label>{{ translate("Address line 2") }}</ion-label>
      <ion-input v-model="postalAddress.address2" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("City") }}</ion-label>
      <ion-input v-model="postalAddress.city" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Country") }}</ion-label>
      <ion-input v-model="postalAddress.country" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("State") }}</ion-label>
      <ion-input v-model="postalAddress.state" slot="end" />
    </ion-item>
    <ion-item>
      <ion-label>{{ translate("Zipcode") }}</ion-label>
      <ion-input v-model="postalAddress.zipcode" slot="end" />
    </ion-item>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button>
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>

<script lang="ts">
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { mapGetters } from "vuex";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'
  
export default defineComponent({
  name: "FacilityAddressModal",
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonTitle,
    IonToolbar
  },
  computed: {
    ...mapGetters({
      postalAddress: 'facility/getPostalAddress'
    })
  },
  methods: {
    closeModal() {
      modalController.dismiss()
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