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
        <ion-input label-placement="floating" v-model="username">
          <div class="ion-text-wrap" slot="label">{{ translate('Username') }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item ref="passwordInput" lines="none">
        <ion-input label-placement="floating" v-model="password" @keyup="validatePassword" @ionBlur="markPasswordTouched" type="password" :helperText="translate('Password should be at least 5 characters long, it contains at least one number, one alphabet and one special character.')">
          <div slot="label">{{ translate('Password') }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input label-placement="floating" v-model="emailAddress">
          <div slot="label">{{ translate('Reset password email') }} <ion-text color="danger">*</ion-text></div>
        </ion-input>
      </ion-item>
    </ion-list>

    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button :disabled="checkCreateUserButtonStatus()" @click="createFacilityLogin()">
        <ion-icon :icon="lockClosedOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>
  
<script setup lang="ts">
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
  IonList,
  IonText,
  IonTitle,
  IonToolbar,
  modalController
} from "@ionic/vue";
import {
  closeOutline,
  eyeOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline
} from "ionicons/icons";
import { translate, commonUtil } from "@common"
import { isValidEmail, isValidPassword } from "@/utils";
import { FacilityService } from "@/services/FacilityService";
import emitter from "@/event-bus";
import { useFacilityStore } from "@/store/facility";
import { useUserStore } from "@/store/user";
import { ref, onMounted } from "vue";

const props = defineProps(["currentFacility", "facilityTypeDesc"]);
const facilityStore = useFacilityStore();
const userStore = useUserStore();

const username = ref(props.currentFacility?.facilityId || '');
const password = ref('');
const emailAddress = ref('');
const passwordInput = ref(null as any);

function closeModal() {
  modalController.dismiss({ dismissed: true });
}

async function createFacilityLogin() {
  if (!username.value) {
    commonUtil.showToast(translate('Username is required.'));
    return;
  } else if (await userStore.isUserLoginIdExists(username.value)) {
    commonUtil.showToast(translate('Could not create login user: user with ID already exists.', { userLoginId: username.value }));
    return;
  }
  try {
    const payload = {
      "facilityId": props.currentFacility?.facilityId,
      "facilityName": props.currentFacility?.facilityName,
      "username": username.value,
      "password": password.value,
      "emailAddress": emailAddress.value
    };

    emitter.emit('presentLoader');
    await FacilityService.createFacilityLogin(payload);
    commonUtil.showToast(translate('Facility login created.'));
    await facilityStore.fetchFacilityLogins({ facilityId: props.currentFacility?.facilityId });
  } catch (error) {
    commonUtil.showToast(translate('Failed to create facility login.'));
  }
  closeModal();
  emitter.emit('dismissLoader');
}

function checkCreateUserButtonStatus() {
  return ((!username.value.length || !password.value.length) || !isValidPassword(password.value) || !isValidEmail(emailAddress.value));
}

function validatePassword(event: any) {
  const value = event.target.value;
  if (!passwordInput.value) return;

  const el = passwordInput.value.$el;
  el.classList.remove('ion-valid');
  el.classList.remove('ion-invalid');

  if (value === '') return;

  isValidPassword(value)
    ? el.classList.add('ion-valid')
    : el.classList.add('ion-invalid');
}

function markPasswordTouched() {
  if (passwordInput.value) {
    passwordInput.value.$el.classList.add('ion-touched');
  }
}
</script>