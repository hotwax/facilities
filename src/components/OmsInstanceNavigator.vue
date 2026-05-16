<template>
  <ion-card>
    <ion-card-header>
      <ion-card-subtitle>
        {{ translate('OMS instance') }}
      </ion-card-subtitle>
      <ion-card-title>
        {{ commonUtil.getOMSInstanceName() }}
      </ion-card-title>
    </ion-card-header>
    <ion-card-content>
      {{ translate('This is the name of the OMS you are connected to right now. Make sure that you are connected to the right instance before proceeding.') }}
    </ion-card-content>
    <ion-button v-if="!commonUtil.isAppEmbedded()" :standalone-hidden="!userStore.hasPermission('COMMON_ADMIN')" @click="goToOms(commonUtil.getToken() || '', commonUtil.getOMSInstanceName())" fill="clear" :disabled="!userStore.hasPermission('COMMERCEUSER_VIEW')">
      {{ translate('Go to OMS') }}
      <ion-icon slot="end" :icon="openOutline" />
    </ion-button>
  </ion-card>
</template>

<script setup lang="ts">
import { 
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon
} from '@ionic/vue';
import { openOutline } from 'ionicons/icons'
import { translate, commonUtil } from "@common";
import { useUserStore } from '@/store/user';

const userStore = useUserStore();

const goToOms = (token: string, oms: string) => {
  const link = (oms.startsWith('http') ? oms.replace(/\/api\/?|\/$/, "") : `https://${oms}.hotwax.io`) + `/commerce/control/main?token=${token}`
  window.open(link, '_blank', 'noopener, noreferrer')
}

</script>

<style scoped>
/* Added conditional hiding in standalone mode that respects user permissions */
@media (display-mode: standalone) {
  [standalone-hidden] {
    display: none;
  }
}
</style>
