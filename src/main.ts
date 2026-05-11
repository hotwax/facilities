import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import logger from './logger';
import { showToast } from '@/utils'

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';
import '@hotwax/apps-theme';

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createDxpI18n, initialiseConfig } from '@hotwax/dxp-components'
import { useUserStore } from '@/store/user'
import { setPermissions } from '@/authorization'
import permissionPlugin, { Actions, hasPermission } from '@/authorization';
import permissionRules from '@/authorization/Rules';
import permissionActions from '@/authorization/Actions';
import { dxpComponents } from '@hotwax/dxp-components'; 
import { login, logout, loader } from '@/utils/user';
import { getConfig, initialise, setUserLocale, setUserTimeZone, getAvailableTimeZones } from './adapter';
import localeMessages from '@/locales';

import defaultImage from "@/assets/images/defaultImage.png";

const pinia = createPinia().use(piniaPluginPersistedstate);
const i18n = createDxpI18n(localeMessages);

const app = createApp(App)
.use(IonicVue, {
  mode: 'md',
  innerHTMLTemplatesEnabled: true
})
.use(logger, {
  level: import.meta.env.VITE_APP_DEFAULT_LOG_LEVEL
})
.use(router)
.use(pinia)
.use(i18n)
.use(permissionPlugin, {
  rules: permissionRules,
  actions: permissionActions
})
.use(dxpComponents, {
  Actions,
  defaultImgUrl: defaultImage,
  login,
  logout,
  loader,
  appLoginUrl: import.meta.env.VITE_APP_LOGIN_URL as string,
  getConfig,
  initialise,
  localeMessages,
  setUserLocale,
  showToast,
  setUserTimeZone, 
  getAvailableTimeZones,
  hasPermission
  });

initialiseConfig({
  postLogin: useUserStore().postLogin,
  postLogout: useUserStore().postLogout,
  get oms() { return useUserStore().oms },
  set oms(val) { useUserStore().oms = val },
  get current() { return useUserStore().current },
  set current(val) { useUserStore().current = val },
  router: router
})

setPermissions(useUserStore().getUserPermissions);

router.isReady().then(() => {
  app.mount('#app');
});