import { getOwner } from 'discourse-common/lib/get-owner';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';
import { withPluginApi } from 'discourse/lib/plugin-api';
import { iconNode } from 'discourse-common/lib/icon-library';
import RawHtml from 'discourse/widgets/raw-html';
import { h } from 'virtual-dom';

export default {
  name: 'title-updater',
  initialize(container) {
    const site = container.lookup('site:main');

    if (site.mobileView) return;

    withPluginApi('0.8.12', api => {
      // 'router and currentRoute are set, and 'route' is added to header args, in site intitializer'
      api.modifyClass('component:site-header', {
        buildArgs() {
          return $.extend(this._super(), {
            title: this.get('title')
          });
        },

        @observes('currentRoute')
        _routeChanged() {
          this.queueRerender();
        },

        @computed()
        discoveryController() {
          return getOwner(this).lookup('controller:discovery');
        },

        @computed()
        topicController() {
          return getOwner(this).lookup('controller:topic');
        },

        @computed('currentRoute')
        title(currentRoute) {
          let title = null;

          if (currentRoute) {
            const isDiscovery = currentRoute.indexOf('discovery') > -1;
            const isTopic = currentRoute.indexOf('topic') > -1;
            const isUser = currentRoute.indexOf('/user/') > -1;
            const isLoading = currentRoute.indexOf('loading') > -1;
            const isApp = currentRoute.indexOf('app') > -1;
            const isLanding = currentRoute.indexOf('landing') > -1;

            if (isDiscovery || isTopic) {
              const discoveryController = this.get('discoveryController');
              const topicController = this.get('topicController');
              const category = isTopic ? topicController.get('model.category') :
                                         discoveryController.get('category');
              if (category) {
                const url = category.get('url');
                title = `<a href='${url}' class='p-text p-link'>${category.name}</a>`;
              }
            }

            if (isUser || isLoading) title = '';

            if (isApp) title = `<a href='/app/store' class='p-text p-link'>${I18n.t('app.store.label')}</a>`;

            if (isLanding) title = `<a href='/start' class='p-text start'>${this.siteSettings.title}</a>`;
          }

          return title;
        }
      });

      api.reopenWidget('home-logo', {
        html(attrs) {
          const title = attrs.title;
          let contents = [
            h('a', {
              attributes: { href: this.href(), 'data-auto-route': true }
            },
            this.logo())
          ];
          if (title) contents.push(h('div.p-text.medium',
            new RawHtml({ html: title })
          ));
          return contents;
        }
      });

      api.reopenWidget('header-topic-info', {
        html(attrs){
          const topic = attrs.topic;
          const heading = [];
          const showPM = !topic.get('is_warning') && topic.get('isPrivateMessage');
          const category = topic.get('category');

          if (category) {
            heading.push(h('span', '/'));
          }

          if (showPM) {
            const href = this.currentUser && this.currentUser.pmPath(topic);
            if (href) {
              heading.push(h('a', { attributes: { href } },
                            h('span.private-message-glyph', iconNode('envelope'))));
            }
          }

          const fancyTitle = topic.get('fancyTitle');
          const href = topic.get('url');

          if (fancyTitle && href) {
            heading.push(this.attach('topic-status', attrs));

            const titleHTML = new RawHtml({ html: `<span>${fancyTitle}</span>` });
            heading.push(this.attach('link', { className: 'topic-link',
                                               action: 'jumpToTopPost',
                                               href,
                                               contents: () => titleHTML }));
          }

          const title = [h('h1', heading)];
          const contents = h('div.title-wrapper', title);
          return h('div.extra-info', { className: title.length > 1 ? 'two-rows' : '' }, contents);
        }
      });
    });
  }
};
