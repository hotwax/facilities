<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button slot="start" default-href="/"/>
        <ion-title>{{ translate("Facility details") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item lines="none" class="ion-margin-top">
        <ion-label>
          <h1>{{ "Facility Name" }}</h1>
          <p>{{ "Facility Id" }}</p>
        </ion-label>
      </ion-item>
  
      <section>
        <div>
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Address") }}
              </ion-card-title>
            </ion-card-header>
            <ion-item lines="full">
              <ion-label>
                <h3>{{ "Address line 1" }}</h3>
                <h3>{{ "Address line 2" }}</h3>
                <p class="ion-text-wrap">{{ "City," }} {{ "Zipcode" }}</p>
                <p class="ion-text-wrap">{{ "State," }} {{ "Country" }}</p>
              </ion-label>
            </ion-item>
            <ion-button fill="clear" @click="addAddress">{{ translate("Edit") }}</ion-button>
            <ion-button expand="block" fill="outline" @click="addAddress">
              {{ translate("Add") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
            </ion-button>
          </ion-card>

          <ion-card>
            <ion-card-header>
              <ion-card-title>
                {{ translate("Latitude & Longitude") }}
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              {{ translate("These values are used to help customers lookup how close they are to your stores when they are finding nearby stores.") }}
            </ion-card-content>
            <ion-item lines="full">
              <ion-label>{{ translate("Latitude") }}</ion-label>
              <p>{{ "<latitude>" }}</p>
            </ion-item>
            <ion-item lines="full">
              <ion-label>{{ translate("Longitude") }}</ion-label>
              <p>{{ "<longitude>" }}</p>
            </ion-item>
            <ion-button fill="clear" @click="addGeoPoint">{{ translate("Edit") }}</ion-button>
            <ion-button expand="block" fill="outline" @click="addGeoPoint">
              {{ translate("Add") }}
              <ion-icon slot="end" :icon="addCircleOutline" />
            </ion-button>
          </ion-card>
        </div>
  
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Operating hours") }}
            </ion-card-title>
          </ion-card-header>
          <ion-list lines="none">
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Monday") }}</p>
              </ion-label>
              <ion-label slot="end">
                {{ "7:30am - 8:00pm" }}
              </ion-label>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Tuesday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Wednesday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Thursday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Friday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Saturday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
            <ion-item button @click="selectOperatingTime">
              <ion-label>
                <p>{{ translate("Sunday") }}</p>
              </ion-label>
              <ion-button fill="clear" color="medium">
                <ion-icon :icon="addOutline" />
                {{ translate("Add timings") }}
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Product Stores") }}
            </ion-card-title>
            <ion-button @click="addProductStore" fill="clear">
              <ion-icon :icon="addCircleOutline" slot="start" />
              {{ translate("Add") }}
            </ion-button>
          </ion-card-header>

          <ion-item>
            <ion-label>
              {{ "NotNaked" }}
            </ion-label>
            <ion-badge>{{ translate("primary store") }}</ion-badge>
            <ion-button color="medium" fill="clear" slot="end" @click="openStorePopover">
              <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
            </ion-button>
          </ion-item>
          
          <ion-item>
            <ion-label>
              {{ "Wasatch Ski company" }}
            </ion-label>
            <ion-button color="medium" fill="clear" slot="end" @click="openStorePopover">
              <ion-icon slot="icon-only" :icon="ellipsisVerticalOutline" />
            </ion-button>
          </ion-item>
        </ion-card>
      </section>
        
      <section>
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Fulfillment Settings") }}
            </ion-card-title>
          </ion-card-header>
          <ion-item>
            <ion-label>{{ translate("Sell Inventory Online") }}</ion-label>
            <ion-toggle :checked="true" slot="end" />
          </ion-item>
          <ion-item>
            <ion-label>{{ translate("Uses native fulfillment app") }}</ion-label>
            <ion-toggle :checked="true" slot="end" />
          </ion-item>
          <ion-item>
            <ion-label>{{ translate("Generate shipping labels") }}</ion-label>
            <ion-toggle :checked="true" slot="end" />
          </ion-item>
          <ion-item>
            <ion-label>{{ translate("Allow pickup") }}</ion-label>
            <ion-toggle :checked="true" slot="end" />
          </ion-item>
          <ion-item lines="full">
            <ion-label>{{ translate("Days to ship") }}</ion-label>
            <ion-input type="number" min="0" placeholder="0"/>
          </ion-item>
          <ion-button fill="outline" expand="block">
            {{ translate("Update days to ship") }}
          </ion-button>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ translate("Online Order Fulfillment") }}
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ translate("Configure the order fulfillment capacity of your facility.") }}
            <br/><br/>
            {{ translate("Setting fulfillment capacity to 0 disables new order from being allocated to this facility. Leave this empty if this facility's fulfillment capacity is unrestricted.") }}
          </ion-card-content>
          <ion-item lines="none">
            <ion-text>{{ 10 }}</ion-text>
            <ion-progress-bar class="ion-margin" :value="10/20"></ion-progress-bar>
            <ion-chip :outline="true">{{ 20 }}</ion-chip>
          </ion-item>
          <ion-item lines="none" class="ion-margin-horizontal" detail button>
            <ion-label>{{ translate("View order count history") }}</ion-label>
          </ion-item>
        </ion-card>
      </section>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader, 
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonProgressBar,
  IonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  popoverController,
  modalController
} from '@ionic/vue'
import { addOutline, addCircleOutline, closeOutline, ellipsisVerticalOutline } from 'ionicons/icons'
import OpenStorePopover from '@/components/OpenStorePopover.vue';
import { translate } from '@hotwax/dxp-components';
import AddAddressModal from '@/components/AddAddressModal.vue'
import AddGeoPointModal from '@/components/AddGeoPointModal.vue';
import SelectProductStoreModal from '@/components/SelectProductStoreModal.vue'
import SelectOperatingTimeModal from '@/components/SelectOperatingTimeModal.vue';

export default defineComponent({
  name: 'FacilityDetails',
  components: {
    IonBackButton,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonChip,
    IonContent,
    IonHeader, 
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonProgressBar,
    IonText,
    IonTitle,
    IonToggle,
    IonToolbar,
  },
  data() {
    return {
      isTimeModalOpen: false as boolean
    }
  },
  methods: {
    async openStorePopover(ev: Event) {
      const popover = await popoverController.create({
        component: OpenStorePopover,
        event: ev,
        showBackdrop: false
      });
      return popover.present()
    },
    async addAddress() {
      const addAddressModal = await modalController.create({
        component: AddAddressModal
      })

      addAddressModal.present()
    },
    async addGeoPoint() {
      const addGeoPointModal = await modalController.create({
        component: AddGeoPointModal
      })

      addGeoPointModal.present()
    },
    async addProductStore() {
      const addProductStoreModal = await modalController.create({
        component: SelectProductStoreModal
      })

      addProductStoreModal.present()
    },
    async selectOperatingTime() {
      const selectOperatingTimeModal = await modalController.create({
        component: SelectOperatingTimeModal
      })
  
      selectOperatingTimeModal.present()
    }
  },
  setup() {
    return {
      addOutline,
      addCircleOutline,
      closeOutline,
      ellipsisVerticalOutline,
      translate
    }
  }
});
</script>

<style scoped>
section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-items: start;
}
ion-modal.date-time-modal {
  --width: 290px;
  --height: 440px;
  --border-radius: 8px;
}

ion-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
