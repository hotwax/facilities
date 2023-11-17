<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ store.storeName }}</ion-list-header>
      <ion-item button>
        {{ translate("Make primary") }}
        <ion-icon slot="end" :icon="starOutline" />
      </ion-item>
      <ion-item button lines="none">
        {{ translate("Unlink") }}
        <ion-icon slot="end" :icon="removeCircleOutline" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonList,
  IonListHeader,
  IonIcon,
  IonItem
} from "@ionic/vue";
import { defineComponent } from "vue";
import { starOutline, removeCircleOutline } from "ionicons/icons";
import { translate } from "@hotwax/dxp-components";

export default defineComponent({
  name: "CreateMappingModal",
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonIcon,
    IonItem
  },
  props: ['store'],
  setup() {
    return {
      removeCircleOutline,
      starOutline,
      translate
    };
  }
});
</script>
