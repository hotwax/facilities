import { translate } from '@hotwax/dxp-components';
import { Plugins } from '@capacitor/core';
import { toastController } from '@ionic/vue';

// TODO Use separate files for specific utilities

const showToast = async (message: string, options?: any) => {  
  const config = {
    message,
    ...options
  } as any;

  if (!options?.position) {
    config.position = 'bottom';
  }
  if (options?.canDismiss) {
    config.buttons = [
      {
        text: translate('Dismiss'),
        role: 'cancel',
      },
    ]
  }
  if (!options?.manualDismiss) {
    config.duration = 3000;
  }

  const toast = await toastController.create(config)
  // present toast if manual dismiss is not needed
  return !options?.manualDismiss ? toast.present() : toast
}

const copyToClipboard = async (value: string, text?: string) => {
  const { Clipboard } = Plugins;

  await Clipboard.write({
    string: value,
  }).then(() => {
    text ? showToast(translate(text)) : showToast(translate("Copied", { value }));
  });
}

const isValidPassword = (password : string) => {
  // Regular expression pattern for a valid password
  const passwordPattern = /^.*(?=.{5,})(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/;
  return passwordPattern.test(password);
}

// will sort the list but keeps the customValues at the beginning
const customSort = (list: any, customValues: Array<string>, sortParameter: string) => {
  return list.sort((first: any, second: any) => {
    const firstVal = customValues.indexOf(first[sortParameter]);
    const secondVal = customValues.indexOf(second[sortParameter]);
    return secondVal - firstVal;
  });
}

const generateInternalId = (name: string) => {
  return name.trim().toUpperCase().split(' ').join('_');
}

export { copyToClipboard, customSort, generateInternalId, isValidPassword, showToast }
