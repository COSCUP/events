<script setup lang="ts">
import facebook from '~/assets/icons/brand-facebook.svg?raw'
import x from '~/assets/icons/brand-x.svg?raw'
import youtube from '~/assets/icons/brand-youtube.svg?raw'
import telegram from '~/assets/icons/brand-telegram.svg?raw'
import mastodon from '~/assets/icons/brand-mastodon.svg?raw'
import linkedin from '~/assets/icons/brand-linkedin.svg?raw'
const { locale, t, path, asset, conductLink } = useSite()
const socials = [
  { name: 'Facebook', url: 'https://www.facebook.com/coscup/', icon: facebook },
  { name: 'X', url: 'https://twitter.com/coscup', icon: x },
  { name: 'YouTube', url: 'https://www.youtube.com/user/thecoscup', icon: youtube },
  { name: 'Telegram', url: 'https://t.me/coscupchat', icon: telegram },
  { name: 'Mastodon', url: 'https://floss.social/%40COSCUP', icon: mastodon },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/coscup-tw/', icon: linkedin },
]
</script>
<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <NuxtLink :to="path()" :aria-label="`COSCUP ${t('upcoming')}`"><img :src="asset('images/coscup-white.svg')" width="90" height="34" alt="COSCUP"></NuxtLink>
        <p class="footer-title">{{ locale === 'en' ? 'COSCUP' : 'COSCUP 開源人年會' }}</p>
        <p class="footer-description" lang="en">Conference for Open Source Coders, Users &amp; Promoters</p>
        <nav class="social-links" :aria-label="locale === 'en' ? 'COSCUP social media' : 'COSCUP 社群平台'">
          <a v-for="social in socials" :key="social.name" :href="social.url" target="_blank" rel="noopener noreferrer" :aria-label="`${social.name} (${t('newTab')})`">
            <span class="social-icon" aria-hidden="true" v-html="social.icon" />
            <span class="tooltip" aria-hidden="true">{{ social.name }}</span>
          </a>
        </nav>
      </div>
      <nav class="footer-links" :aria-label="locale === 'en' ? 'Footer navigation' : '頁尾導覽'">
        <NuxtLink :to="path('/about/')">{{ t('about') }}</NuxtLink>
        <ExternalLink href="https://coscup.org/2026/">{{ locale === 'en' ? 'Conference' : '年會官網' }}</ExternalLink>
        <NuxtLink id="footer-conduct" :to="conductLink('footer')" data-remember-focus>{{ t('conduct') }}</NuxtLink>
        <ExternalLink href="https://github.com/COSCUP/events">GitHub</ExternalLink>
        <ExternalLink href="https://blog.coscup.org/">Blog</ExternalLink>
        <ExternalLink href="https://secretary.coscup.org/">{{ t('newsletter') }}</ExternalLink>
        <LanguageSwitch />
      </nav>
    </div>
  </footer>
</template>
