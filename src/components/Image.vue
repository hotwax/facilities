<template>
  <img :src="imageUrl" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import logger from "@/logger";
import defaultImage from "@/assets/images/defaultImage.png";

const props = defineProps(['src']);

const resourceUrl = import.meta.env.VITE_APP_RESOURCE_URL || '';
const imageUrl = ref(defaultImage);

function checkIfImageExists(src: string) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => reject(false);
    img.src = src;
  });
}

async function setImageUrl() {
  if (props.src) {
    if (props.src.indexOf('assets/') !== -1) {
      // Assign directly in case of assets
      imageUrl.value = props.src;
    } else if (props.src.startsWith('http')) {
      // If starts with http, it is web url check for existence and assign
      try {
        await checkIfImageExists(props.src);
        imageUrl.value = props.src;
      } catch (error) {
        logger.error("Image doesn't exist", props.src);
        imageUrl.value = defaultImage;
      }
    } else {
      // Image is from resource server, hence append to base resource url, check for existence and assign
      const fullImageUrl = resourceUrl.concat(props.src);
      try {
        await checkIfImageExists(fullImageUrl);
        imageUrl.value = fullImageUrl;
      } catch (error) {
        logger.error("Image doesn't exist", fullImageUrl);
        imageUrl.value = defaultImage;
      }
    }
  } else {
    imageUrl.value = defaultImage;
  }
}

onMounted(() => {
  setImageUrl();
});

watch(() => props.src, () => {
  setImageUrl();
});
</script>
