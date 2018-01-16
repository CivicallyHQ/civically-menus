import { withPluginApi } from 'discourse/lib/plugin-api';
import { applyDecorators } from 'discourse/widgets/widget';
import { avatarImg } from 'discourse/widgets/post';
import RawHtml from 'discourse/widgets/raw-html';

export default {
  name: 'menu-edits',
  initialize(){

    withPluginApi('0.5', api => {
      api.reopenWidget('hamburger-menu', {
        generalLinks() {
          const { siteSettings } = this;
          const flatten = array => [].concat.apply([], array);
          const links = [];

          if (siteSettings.enable_badges) {
            links.push({ route: 'badges', className: 'badge-link', label: 'badges.title' });
          }

          if (this.showUserDirectory()) {
            links.push({ route: 'users', className: 'user-directory-link', label: 'directory.title' });
          }

          if (siteSettings.enable_group_directory) {
            links.push({ route: 'groups', className: 'groups-link', label: 'groups.index.title' });
          }

          if (siteSettings.tagging_enabled) {
            links.push({ route: 'tags', label: 'tagging.tags' });
          }

          const extraLinks = flatten(applyDecorators(this, 'generalLinks', this.attrs, this.state));
          return links.concat(extraLinks).map(l => this.attach('link', l));
        },

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

      api.reopenWidget('header-notifications', {
        html(attrs) {
          const { currentUser } = this;

          const contents = [avatarImg(this.settings.avatarSize, {
            template: currentUser.get('avatar_template'),
            username: currentUser.get('username')
          })];

          const unreadNotifications = currentUser.get('unread_notifications');
          if (!!unreadNotifications) {
            contents.push(this.attach('link', { action: attrs.action,
                                                className: 'badge-notification unread-notifications',
                                                rawLabel: unreadNotifications,
                                                omitSpan: true }));
          }

          const unreadPMs = currentUser.get('unread_private_messages');
          if (!!unreadPMs) {
            contents.push(this.attach('link', { action: attrs.action,
                                                className: 'badge-notification unread-private-messages',
                                                rawLabel: unreadPMs,
                                                omitSpan: true }));
          }

          return contents;
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
