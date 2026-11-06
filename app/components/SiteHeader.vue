<script setup lang="ts">
const { locale, t, path, asset, conductLink } = useSite()
</script>
<template>
  <header class="site-header">
    <div class="container header-inner">
      <NuxtLink :to="path()" class="brand" :aria-label="`COSCUP ${t('upcoming')}`">
        <img :src="asset('images/coscup-green.svg')" width="90" height="34" alt="COSCUP">
        <span>{{ t('events') }}</span>
      </NuxtLink>
      <nav :aria-label="locale === 'en' ? 'Main navigation' : '主要導覽'">
        <ExternalLink class="desktop-nav" href="https://coscup.org/2026/">{{ t('conference') }}</ExternalLink>
        <NuxtLink id="header-conduct" class="desktop-nav" :to="conductLink('header')" data-remember-focus>{{ t('conduct') }}</NuxtLink>
        <NuxtLink class="desktop-nav" :to="path('/about/')">{{ t('about') }}</NuxtLink>
        <LanguageSwitch />
      </nav>
    </div>
  </header>
</template>
