<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{ translate(`Create ${facilityTypeDesc} login`) }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content>
    <ion-list>
      <ion-item>
        <ion-label class="ion-text-wrap" position="floating">
          {{ translate('Username') }} <ion-text color="danger">*</ion-text>
        </ion-label>
        <ion-input v-model="username" />
      </ion-item>
      <ion-item ref="password">
        <ion-label class="ion-text-wrap" position="floating">
          {{ translate('Password') }} <ion-text color="danger">*</ion-text>
        </ion-label>
        <ion-input v-model="password" @keyup="validatePassword" @ionBlur="markPasswordTouched" type="password" />
        <ion-note slot="helper">
          {{ translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.') }}
        </ion-note>
      </ion-item>
      <ion-item>
        <ion-label position="floating">{{ translate('Reset password email') }} <ion-text
            color="danger">*</ion-text></ion-label>
        <ion-input v-model="emailAddress"></ion-input>
      </ion-item>
    </ion-list>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="checkCreateUserButtonStatus()" @click="createFacilityLogin()">
        <ion-icon :icon="lockClosedOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script lang="ts">
import {
  IonButtons,
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonText,
  IonToolbar,
  modalController
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { useStore } from "vuex";
import { translate } from '@hotwax/dxp-components'
import { isValidEmail, isValidPassword, showToast } from "@/utils";
import { FacilityService } from "@/services/FacilityService";
import { UserService } from "@/services/UserService";
import emitter from "@/event-bus";

export default defineComponent({
  name: "CustomFieldModal",
  components: {
    IonButtons,
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonTitle,
    IonToolbar,
    IonText,
  },
  data() {
    return {
      username: this.currentFacility?.facilityId,
      password: '',
      emailAddress: '',
    }
  },
  props: ["currentFacility", "facilityTypeDesc"],
  methods: {
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    async createFacilityLogin() {
      if (!this.username) {
        showToast(translate('Username is required.'))
        return
      } else if (await UserService.isUserLoginIdExists(this.username)) {
        showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: this.username }))
        return;
      }
      try {
        const payload = {
          "facilityId": this.currentFacility?.facilityId,
          "facilityName": this.currentFacility?.facilityName,
          "username": this.username,
          "password": this.password,
          "emailAddress": this.emailAddress
        }

        emitter.emit('presentLoader')
        await FacilityService.createFacilityLogin(payload);
        showToast(translate('Facility login created.'))
        await this.store.dispatch('facility/fetchFacilityLogins', { facilityId: this.currentFacility?.facilityId });
      } catch (error) {
        showToast(translate('Failed to create facility login.'))
      }
      this.closeModal();
      emitter.emit('dismissLoader')
    },
    checkCreateUserButtonStatus() {
      return ((!this.username.length || !this.password.length) || !isValidPassword(this.password) || !isValidEmail(this.emailAddress));
    },
    validatePassword(event: any) {
      const value = event.target.value;
      (this as any).$refs.password.$el.classList.remove('ion-valid');
      (this as any).$refs.password.$el.classList.remove('ion-invalid');

      if (value === '') return;

      isValidPassword(value)
        ? (this as any).$refs.password.$el.classList.add('ion-valid')
        : (this as any).$refs.password.$el.classList.add('ion-invalid');
    },
    markPasswordTouched() {
      (this as any).$refs.password.$el.classList.add('ion-touched');
    },
    markConfirmPasswordTouched() {
      (this as any).$refs.confirmPassword.$el.classList.add('ion-touched');
    },
  },
  setup() {
    const store = useStore();

    return {
      closeOutline,
      eyeOutline,
      eyeOffOutline,
      lockClosedOutline,
      mailOutline,
      store,
      translate
    };
  },
});
</script>
  