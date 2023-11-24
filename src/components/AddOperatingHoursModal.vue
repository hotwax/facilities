<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal"> 
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate("Add operating hours") }}</ion-title>
    </ion-toolbar>
  </ion-header>
  
  <ion-content>
    <ion-accordion-group :value="selectedCalendarId" @ionChange="updateSelectedCalendar($event)">
      <ion-radio-group :value="selectedCalendarId">
        <ion-accordion value="first">
          <ion-item slot="header" color="light">
            <ion-radio value="first" slot="start" />
            <ion-label>
              {{ "Calendar 1" }}
            </ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">First Content</div>
        </ion-accordion>
        <ion-accordion value="second">
          <ion-item slot="header" color="light">
            <ion-radio value="second" slot="start" />
            <ion-label>
              {{ "Calendar 2" }}
            </ion-label>
          </ion-item>
          <div class="ion-padding" slot="content">Second Content</div>
        </ion-accordion>
      </ion-radio-group>
    </ion-accordion-group>
  </ion-content>

  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button>
      <ion-icon :icon="saveOutline" />
    </ion-fab-button>
  </ion-fab>
</template>
  
<script lang="ts">
import { 
  IonAccordion,
  IonAccordionGroup,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { closeOutline, saveOutline } from "ionicons/icons";
import { translate } from '@hotwax/dxp-components'

export default defineComponent({
  name: "AddOperatingHoursModal",
  components: { 
    IonAccordion,
    IonAccordionGroup,
    IonButton,
    IonButtons,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonRadio,
    IonRadioGroup,
    IonTitle,
    IonToolbar,
  },
  data() {
    return {
      selectedCalendarId:'second'
    }
  },
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true});
    },
    updateSelectedCalendar(ev: CustomEvent) {
      this.selectedCalendarId= ev.detail.value
      
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

<style scoped>
ion-content {
  --padding-bottom: 80px;
}
</style>