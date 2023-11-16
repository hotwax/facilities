<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ translate("Location details") }}</ion-list-header>
      <ion-item button>
        {{ translate("Edit location") }}
      </ion-item>
      <ion-item button lines="none">
        {{ translate("Remove location") }}
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonList,
  IonListHeader,
  IonItem
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@hotwax/dxp-components";

export default defineComponent({
  name: "LocationDetailsPopover",
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonItem
  },
  setup() {
    return {
      translate
    };
  }
});
</script>
