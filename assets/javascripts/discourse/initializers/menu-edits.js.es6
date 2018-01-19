import { withPluginApi } from 'discourse/lib/plugin-api';
import { applyDecorators } from 'discourse/widgets/widget';
import RawHtml from 'discourse/widgets/raw-html';

export default {
  name: 'menu-edits',
  initialize(){

    withPluginApi('0.5', api => {
      api.reopenWidget('hamburger-menu', {
        panelContents() {
          const results = [];
          const flatten = array => [].concat.apply([], array);
          const { currentUser, siteSettings, site } = this;

          let shortcutOpts = {};
          if (!site.mobileView && !this.capabilities.touch) {
            shortcutOpts = {
              action: 'showKeyboard',
              className: 'keyboard-shortcuts-link',
              label: 'keyboard_shortcuts_help.title'
            };
          }

          if (site.mobileView || (siteSettings.enable_mobile_theme && this.capabilities.touch)) {
            shortcutOpts = {
              action: 'toggleMobileView',
              className: 'mobile-toggle-link',
              label: site.mobileView ? "desktop_view" : "mobile_view"
            };
          }

          let links = [
            this.attach('link', {route: 'faq', label: 'faq'}),
            this.attach('link', {route: 'about', label: 'about.simple_title'}),
            this.attach('link', {route: 'tos', label: 'terms_of_service'}),
            this.attach('link', {route: 'privacy', label: 'privacy'}),
            this.attach('link', shortcutOpts),
            this.attach('link', {route: 'app.store', contents: () => {
              let html = `<span>${I18n.t('app.store.label')}`;
              if (!Discourse.SiteSettings.app_store_enabled) {
                html += ` <div class='coming-soon'>
                          <span class='label'>${I18n.t('civically.coming_soon')}</span>
                         </div>`;
              }
              html += '</span>';
              return new RawHtml({ html });
            }})
          ];

          results.push(this.attach('menu-links', { heading: true, contents: () => {
            return links;
          }}));

          if (currentUser && currentUser.staff) {
            results.push(this.attach('menu-links', { contents: () => {
              const extraLinks = flatten(applyDecorators(this, 'admin-links', this.attrs, this.state));
              return this.adminLinks().concat(extraLinks);
            }}));
          }

          return results;
        }
      });

      api.addUserMenuGlyph({
        label: 'app.user.label',
        icon: 'rocket',
        href: '/my/apps'
      });
    });
  }
};
