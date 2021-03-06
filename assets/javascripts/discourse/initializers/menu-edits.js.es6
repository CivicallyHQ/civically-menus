import { withPluginApi } from 'discourse/lib/plugin-api';
import { applyDecorators } from 'discourse/widgets/widget';
import RawHtml from 'discourse/widgets/raw-html';

export default {
  name: 'menu-edits',
  initialize(){

    withPluginApi('0.8.12', api => {
      api.reopenWidget('header-notifications', {
        html(attrs, state) {
          let contents = this._super(attrs, state);
          contents = contents.filter((node) => {
            return !node.properties ||
                   !node.properties.className ||
                   !(node.properties.className.indexOf('ring') > -1);
          });
          return contents;
        }
      });

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

          const userLinks = [
            this.attach('link', {route: 'groups', label: 'groups.index.title' }),
            this.attach('link', {route: 'badges', label: 'badges.title' }),
            this.attach('link', {route: 'app.store', contents: () => {
              let html = `<span>${I18n.t('app.store.label')}`;
              html += '</span>';
              return new RawHtml({ html });
            }})
          ];

          results.push(this.attach('menu-links', {
            name: 'user-links',
            heading: true, contents: () => {
              return userLinks;
            }
          }));

          let generalLinks = [
            this.attach('link', {route: 'about', label: 'about.simple_title'}),
            this.attach('link', {route: 'team', label: 'team.label'}),
            this.attach('link', {route: 'faq', label: 'faq'}),
            this.attach('link', {route: 'tos', label: 'tos'}),
            this.attach('link', {route: 'privacy', label: 'privacy'}),
            this.attach('link', {route: 'landingOrganisations', label: 'landing.organisation.label'}),
            this.attach('link', shortcutOpts),
          ];

          if (Discourse.SiteSettings.discourse_donations_enabled) {
            generalLinks.splice(2, 0, this.attach('link', {
              route: 'donate',
              label: 'discourse_donations.nav_item'
            }));
          }

          const isStaff = currentUser && currentUser.staff;

          results.push(this.attach('menu-links', {
            name: 'general-links',
            heading: true,
            omitRule: !isStaff,
            contents: () => {
              return generalLinks;
            }
          }));

          if (isStaff) {
            results.push(this.attach('menu-links', {
              omitRule: true,
              contents: () => {
                const extraLinks = flatten(applyDecorators(this, 'admin-links', this.attrs, this.state));
                return this.adminLinks().concat(extraLinks);
              }
            }));
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
