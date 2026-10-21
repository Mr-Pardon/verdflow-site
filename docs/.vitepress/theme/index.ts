import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';
import ContentLicense from './ContentLicense.vue';
import HomePage from './HomePage.vue';
import RouteChooser from './RouteChooser.vue';
import Shot from './Shot.vue';
import ReleaseAccess from './ReleaseAccess.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-after': () => h(ContentLicense),
  }),
  enhanceApp({ app }) {
    app.component('HomePage', HomePage);
    app.component('RouteChooser', RouteChooser);
    app.component('Shot', Shot);
    app.component('ReleaseAccess', ReleaseAccess);
  },
} satisfies Theme;
