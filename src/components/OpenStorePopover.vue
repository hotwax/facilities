<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ getStoreDetail(currentProductStore.productStoreId).storeName }}</ion-list-header>
      <ion-item button>
        {{ translate("Make primary") }}
        <ion-icon slot="end" :icon="starOutline" />
      </ion-item>
      <ion-item button lines="none" @click="removeStore">
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
import { mapGetters, useStore } from "vuex";
import { FacilityService } from "@/services/FacilityService";
import { DateTime } from "luxon";
import { hasError } from "@hotwax/oms-api";
import { showToast } from "@/utils";

export default defineComponent({
  name: "CreateMappingModal",
  components: {
    IonContent,
    IonList,
    IonListHeader,
    IonIcon,
    IonItem
  },
  props: ['facilityId', 'currentProductStore'],
  computed: {
    ...mapGetters({
      facilityProductStores: 'facility/getFacilityProductStores',
      productStores: 'util/getProductStores'
    })
  },
  methods: {
    async removeStore() {
      try {
        const resp = await FacilityService.updateProductStoreFacility({
          facilityId: this.facilityId,
          productStoreId: this.currentProductStore.productStoreId,
          fromDate: this.currentProductStore.fromDate,
          thruDate: DateTime.now().toMillis()
        })

        if(!hasError(resp)) {
          showToast(translate('Store unlinked successfully.'))

          // refetching product stores with updated roles
          await this.store.dispatch('facility/getFacilityProductStores', { facilityId: this.facilityId })
        }
      } catch(err) {
        console.error(err)
        showToast(translate('Store unlink failed.'))
      }
    },
    getStoreDetail(productStoreId: any) {
      return this.productStores.find((store: any) => store.productStoreId === productStoreId)
    }
  },
  setup() {
    const store = useStore();

    return {
      removeCircleOutline,
      starOutline,
      store,
      translate
    };
  }
});
</script>
